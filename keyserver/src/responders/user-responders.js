// @flow

import invariant from 'invariant';
import { ErrorTypes, SiweMessage } from 'siwe';
import t from 'tcomb';
import bcrypt from 'twin-bcrypt';

import { policies } from 'lib/facts/policies.js';
import { hasMinCodeVersion } from 'lib/shared/version-utils';
import type {
  ResetPasswordRequest,
  LogOutResponse,
  DeleteAccountRequest,
  RegisterResponse,
  RegisterRequest,
  LogInResponse,
  LogInRequest,
  UpdatePasswordRequest,
  UpdateUserSettingsRequest,
  PolicyAcknowledgmentRequest,
} from 'lib/types/account-types';
import {
  userSettingsTypes,
  notificationTypeValues,
  logInActionSources,
} from 'lib/types/account-types';
import type { CalendarQuery } from 'lib/types/entry-types.js';
import { defaultNumberPerThread } from 'lib/types/message-types';
import type {
  SIWEAuthRequest,
  SIWEMessage,
  SIWESocialProof,
} from 'lib/types/siwe-types.js';
import type {
  SubscriptionUpdateRequest,
  SubscriptionUpdateResponse,
} from 'lib/types/subscription-types';
import type { PasswordUpdate } from 'lib/types/user-types';
import { ServerError } from 'lib/utils/errors';
import { values } from 'lib/utils/objects';
import { promiseAll } from 'lib/utils/promises';
import {
  getPublicKeyFromSIWEStatement,
  isValidSIWEMessage,
  isValidSIWEStatementWithPublicKey,
} from 'lib/utils/siwe-utils.js';
import {
  tShape,
  tPlatformDetails,
  tPassword,
  tEmail,
  tOldValidUsername,
} from 'lib/utils/validation-utils';

import {
  createAccount,
  processSIWEAccountCreation,
} from '../creators/account-creator';
import { dbQuery, SQL } from '../database/database';
import { deleteAccount } from '../deleters/account-deleters';
import { deleteCookie } from '../deleters/cookie-deleters';
import { checkAndInvalidateSIWENonceEntry } from '../deleters/siwe-nonce-deleters.js';
import { fetchEntryInfos } from '../fetchers/entry-fetchers';
import { fetchMessageInfos } from '../fetchers/message-fetchers';
import { fetchThreadInfos } from '../fetchers/thread-fetchers';
import {
  fetchKnownUserInfos,
  fetchLoggedInUserInfo,
  fetchUserIDForEthereumAddress,
} from '../fetchers/user-fetchers';
import {
  createNewAnonymousCookie,
  createNewUserCookie,
  setNewSession,
} from '../session/cookies';
import type { Viewer } from '../session/viewer';
import {
  accountUpdater,
  checkAndSendVerificationEmail,
  checkAndSendPasswordResetEmail,
  updatePassword,
  updateUserSettings,
} from '../updaters/account-updaters';
import { userSubscriptionUpdater } from '../updaters/user-subscription-updaters';
import { viewerAcknowledgmentUpdater } from '../updaters/viewer-acknowledgment-updater.js';
import { validateInput } from '../utils/validation-utils';
import {
  entryQueryInputValidator,
  newEntryQueryInputValidator,
  normalizeCalendarQuery,
  verifyCalendarQueryThreadIDs,
} from './entry-responders';

const subscriptionUpdateRequestInputValidator = tShape({
  threadID: t.String,
  updatedFields: tShape({
    pushNotifs: t.maybe(t.Boolean),
    home: t.maybe(t.Boolean),
  }),
});

async function userSubscriptionUpdateResponder(
  viewer: Viewer,
  input: any,
): Promise<SubscriptionUpdateResponse> {
  const request: SubscriptionUpdateRequest = input;
  await validateInput(viewer, subscriptionUpdateRequestInputValidator, request);
  const threadSubscription = await userSubscriptionUpdater(viewer, request);
  return { threadSubscription };
}

const accountUpdateInputValidator = tShape({
  updatedFields: tShape({
    email: t.maybe(tEmail),
    password: t.maybe(tPassword),
  }),
  currentPassword: tPassword,
});

async function passwordUpdateResponder(
  viewer: Viewer,
  input: any,
): Promise<void> {
  const request: PasswordUpdate = input;
  await validateInput(viewer, accountUpdateInputValidator, request);
  await accountUpdater(viewer, request);
}

async function sendVerificationEmailResponder(viewer: Viewer): Promise<void> {
  await validateInput(viewer, null, null);
  await checkAndSendVerificationEmail(viewer);
}

const resetPasswordRequestInputValidator = tShape({
  usernameOrEmail: t.union([tEmail, tOldValidUsername]),
});

async function sendPasswordResetEmailResponder(
  viewer: Viewer,
  input: any,
): Promise<void> {
  const request: ResetPasswordRequest = input;
  await validateInput(viewer, resetPasswordRequestInputValidator, request);
  await checkAndSendPasswordResetEmail(request);
}

async function logOutResponder(viewer: Viewer): Promise<LogOutResponse> {
  await validateInput(viewer, null, null);
  if (viewer.loggedIn) {
    const [anonymousViewerData] = await Promise.all([
      createNewAnonymousCookie({
        platformDetails: viewer.platformDetails,
        deviceToken: viewer.deviceToken,
      }),
      deleteCookie(viewer.cookieID),
    ]);
    viewer.setNewCookie(anonymousViewerData);
  }
  return {
    currentUserInfo: {
      id: viewer.id,
      anonymous: true,
    },
  };
}

const deleteAccountRequestInputValidator = tShape({
  password: t.maybe(tPassword),
});

async function accountDeletionResponder(
  viewer: Viewer,
  input: any,
): Promise<LogOutResponse> {
  const request: DeleteAccountRequest = input;
  await validateInput(viewer, deleteAccountRequestInputValidator, request);
  const result = await deleteAccount(viewer, request);
  invariant(result, 'deleteAccount should return result if handed request');
  return result;
}

const deviceTokenUpdateRequestInputValidator = tShape({
  deviceType: t.maybe(t.enums.of(['ios', 'android'])),
  deviceToken: t.String,
});

const registerRequestInputValidator = tShape({
  username: t.String,
  email: t.maybe(tEmail),
  password: tPassword,
  calendarQuery: t.maybe(newEntryQueryInputValidator),
  deviceTokenUpdateRequest: t.maybe(deviceTokenUpdateRequestInputValidator),
  platformDetails: tPlatformDetails,
});

async function accountCreationResponder(
  viewer: Viewer,
  input: any,
): Promise<RegisterResponse> {
  const request: RegisterRequest = input;
  await validateInput(viewer, registerRequestInputValidator, request);
  return await createAccount(viewer, request);
}

async function processSuccessfulLogin(
  viewer: Viewer,
  input: any,
  userID: string,
  calendarQuery: ?CalendarQuery,
  primaryIdentityPublicKey?: ?string,
  socialProof?: ?SIWESocialProof,
): Promise<LogInResponse> {
  const request: LogInRequest = input;
  const newServerTime = Date.now();
  const deviceToken = request.deviceTokenUpdateRequest
    ? request.deviceTokenUpdateRequest.deviceToken
    : viewer.deviceToken;
  const [userViewerData] = await Promise.all([
    createNewUserCookie(userID, {
      platformDetails: request.platformDetails,
      deviceToken,
      primaryIdentityPublicKey,
      socialProof,
    }),
    deleteCookie(viewer.cookieID),
  ]);
  viewer.setNewCookie(userViewerData);
  if (calendarQuery) {
    await setNewSession(viewer, calendarQuery, newServerTime);
  }

  const threadCursors = {};
  for (const watchedThreadID of request.watchedIDs) {
    threadCursors[watchedThreadID] = null;
  }
  const messageSelectionCriteria = { threadCursors, joinedThreads: true };

  const [
    threadsResult,
    messagesResult,
    entriesResult,
    userInfos,
    currentUserInfo,
  ] = await Promise.all([
    fetchThreadInfos(viewer),
    fetchMessageInfos(viewer, messageSelectionCriteria, defaultNumberPerThread),
    calendarQuery ? fetchEntryInfos(viewer, [calendarQuery]) : undefined,
    fetchKnownUserInfos(viewer),
    fetchLoggedInUserInfo(viewer),
  ]);

  const rawEntryInfos = entriesResult ? entriesResult.rawEntryInfos : null;
  const response: LogInResponse = {
    currentUserInfo,
    rawMessageInfos: messagesResult.rawMessageInfos,
    truncationStatuses: messagesResult.truncationStatuses,
    serverTime: newServerTime,
    userInfos: values(userInfos),
    cookieChange: {
      threadInfos: threadsResult.threadInfos,
      userInfos: [],
    },
  };
  if (rawEntryInfos) {
    response.rawEntryInfos = rawEntryInfos;
  }
  return response;
}

const logInRequestInputValidator = tShape({
  username: t.maybe(t.String),
  usernameOrEmail: t.maybe(t.union([tEmail, tOldValidUsername])),
  password: tPassword,
  watchedIDs: t.list(t.String),
  calendarQuery: t.maybe(entryQueryInputValidator),
  deviceTokenUpdateRequest: t.maybe(deviceTokenUpdateRequestInputValidator),
  platformDetails: tPlatformDetails,
  source: t.maybe(t.enums.of(values(logInActionSources))),
});

async function logInResponder(
  viewer: Viewer,
  input: any,
): Promise<LogInResponse> {
  await validateInput(viewer, logInRequestInputValidator, input);
  const request: LogInRequest = input;

  const calendarQuery = request.calendarQuery
    ? normalizeCalendarQuery(request.calendarQuery)
    : null;
  const promises = {};
  if (calendarQuery) {
    promises.verifyCalendarQueryThreadIDs = verifyCalendarQueryThreadIDs(
      calendarQuery,
    );
  }
  const username = request.username ?? request.usernameOrEmail;
  if (!username) {
    if (hasMinCodeVersion(viewer.platformDetails, 150)) {
      throw new ServerError('invalid_credentials');
    } else {
      throw new ServerError('invalid_parameters');
    }
  }
  const userQuery = SQL`
    SELECT id, hash, username
    FROM users
    WHERE LCASE(username) = LCASE(${username})
  `;
  promises.userQuery = dbQuery(userQuery);
  const {
    userQuery: [userResult],
  } = await promiseAll(promises);

  if (userResult.length === 0) {
    if (hasMinCodeVersion(viewer.platformDetails, 150)) {
      throw new ServerError('invalid_credentials');
    } else {
      throw new ServerError('invalid_parameters');
    }
  }

  const userRow = userResult[0];

  if (!userRow.hash || !bcrypt.compareSync(request.password, userRow.hash)) {
    throw new ServerError('invalid_credentials');
  }

  const id = userRow.id.toString();
  return await processSuccessfulLogin(viewer, input, id, calendarQuery);
}

const siweAuthRequestInputValidator = tShape({
  signature: t.String,
  message: t.String,
  calendarQuery: entryQueryInputValidator,
  deviceTokenUpdateRequest: t.maybe(deviceTokenUpdateRequestInputValidator),
  platformDetails: tPlatformDetails,
  watchedIDs: t.list(t.String),
});

async function siweAuthResponder(
  viewer: Viewer,
  input: any,
): Promise<LogInResponse> {
  await validateInput(viewer, siweAuthRequestInputValidator, input);
  const request: SIWEAuthRequest = input;
  const {
    message,
    signature,
    deviceTokenUpdateRequest,
    platformDetails,
  } = request;
  const calendarQuery = normalizeCalendarQuery(request.calendarQuery);

  // 1. Ensure that `message` is a well formed Comm SIWE Auth message.
  const siweMessage: SIWEMessage = new SiweMessage(message);
  if (!isValidSIWEMessage(siweMessage)) {
    throw new ServerError('invalid_parameters');
  }

  // 2. Ensure that the `nonce` exists in the `siwe_nonces` table
  //    AND hasn't expired. If those conditions are met, delete the entry to
  //    ensure that the same `nonce` can't be re-used in a future request.
  const wasNonceCheckedAndInvalidated = await checkAndInvalidateSIWENonceEntry(
    siweMessage.nonce,
  );
  if (!wasNonceCheckedAndInvalidated) {
    throw new ServerError('invalid_parameters');
  }

  // 3. Validate SIWEMessage signature and handle possible errors.
  try {
    await siweMessage.validate(signature);
  } catch (error) {
    if (error === ErrorTypes.EXPIRED_MESSAGE) {
      // Thrown when the `expirationTime` is present and in the past.
      throw new ServerError('expired_message');
    } else if (error === ErrorTypes.INVALID_SIGNATURE) {
      // Thrown when the `validate()` function can't verify the message.
      throw new ServerError('invalid_signature');
    } else if (error === ErrorTypes.MALFORMED_SESSION) {
      // Thrown when some required field is missing.
      throw new ServerError('malformed_session');
    } else {
      throw new ServerError('unknown_error');
    }
  }

  // 4. Pull `primaryIdentityPublicKey` out from SIWEMessage `statement`
  //    if it was included. We expect it to be included for native clients,
  //    and we expect it to be EXCLUDED for web clients.
  const { statement } = siweMessage;
  const primaryIdentityPublicKey =
    statement && isValidSIWEStatementWithPublicKey(statement)
      ? getPublicKeyFromSIWEStatement(statement)
      : null;

  // 5. Construct `SIWESocialProof` object with the stringified
  //    SIWEMessage and the corresponding signature.
  const socialProof: SIWESocialProof = {
    siweMessage: siweMessage.toMessage(),
    siweMessageSignature: signature,
  };

  // 6. Create account with call to `processSIWEAccountCreation(...)`
  //    if address does not correspond to an existing user.
  let userID = await fetchUserIDForEthereumAddress(siweMessage.address);
  if (!userID) {
    const siweAccountCreationRequest = {
      address: siweMessage.address,
      deviceTokenUpdateRequest: deviceTokenUpdateRequest,
      platformDetails,
      primaryIdentityPublicKey: primaryIdentityPublicKey,
      socialProof: socialProof,
    };
    userID = await processSIWEAccountCreation(
      viewer,
      siweAccountCreationRequest,
    );
  }

  // 7. Complete login with call to `processSuccessfulLogin(...)`.
  return await processSuccessfulLogin(
    viewer,
    input,
    userID,
    calendarQuery,
    primaryIdentityPublicKey,
    socialProof,
  );
}

const updatePasswordRequestInputValidator = tShape({
  code: t.String,
  password: tPassword,
  watchedIDs: t.list(t.String),
  calendarQuery: t.maybe(entryQueryInputValidator),
  deviceTokenUpdateRequest: t.maybe(deviceTokenUpdateRequestInputValidator),
  platformDetails: tPlatformDetails,
});

async function oldPasswordUpdateResponder(
  viewer: Viewer,
  input: any,
): Promise<LogInResponse> {
  await validateInput(viewer, updatePasswordRequestInputValidator, input);
  const request: UpdatePasswordRequest = input;
  if (request.calendarQuery) {
    request.calendarQuery = normalizeCalendarQuery(request.calendarQuery);
  }
  return await updatePassword(viewer, request);
}

const updateUserSettingsInputValidator = tShape({
  name: t.irreducible(
    userSettingsTypes.DEFAULT_NOTIFICATIONS,
    x => x === userSettingsTypes.DEFAULT_NOTIFICATIONS,
  ),
  data: t.enums.of(notificationTypeValues),
});

async function updateUserSettingsResponder(
  viewer: Viewer,
  input: any,
): Promise<void> {
  const request: UpdateUserSettingsRequest = input;
  await validateInput(viewer, updateUserSettingsInputValidator, request);
  return await updateUserSettings(viewer, request);
}

const policyAcknowledgmentRequestInputValidator = tShape({
  policy: t.maybe(t.enums.of(policies)),
});

async function policyAcknowledgmentResponder(
  viewer: Viewer,
  input: any,
): Promise<void> {
  const request: PolicyAcknowledgmentRequest = input;
  await validateInput(
    viewer,
    policyAcknowledgmentRequestInputValidator,
    request,
  );
  await viewerAcknowledgmentUpdater(viewer, request.policy);
}

export {
  userSubscriptionUpdateResponder,
  passwordUpdateResponder,
  sendVerificationEmailResponder,
  sendPasswordResetEmailResponder,
  logOutResponder,
  accountDeletionResponder,
  accountCreationResponder,
  logInResponder,
  siweAuthResponder,
  oldPasswordUpdateResponder,
  updateUserSettingsResponder,
  policyAcknowledgmentResponder,
};
