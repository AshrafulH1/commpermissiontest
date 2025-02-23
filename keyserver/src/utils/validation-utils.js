// @flow

import type { PolicyType } from 'lib/facts/policies.js';
import { hasMinCodeVersion } from 'lib/shared/version-utils.js';
import { ServerError } from 'lib/utils/errors';
import {
  tCookie,
  tPassword,
  tPlatform,
  tPlatformDetails,
} from 'lib/utils/validation-utils';

import { fetchPolicyAcknowledgments } from '../fetchers/policy-acknowledgment-fetchers.js';
import { verifyClientSupported } from '../session/version';
import type { Viewer } from '../session/viewer';

async function validateInput(viewer: Viewer, inputValidator: *, input: *) {
  if (!viewer.isSocket) {
    await checkClientSupported(viewer, inputValidator, input);
  }
  checkInputValidator(inputValidator, input);
}

function checkInputValidator(inputValidator: *, input: *) {
  if (!inputValidator || inputValidator.is(input)) {
    return;
  }
  const error = new ServerError('invalid_parameters');
  error.sanitizedInput = input ? sanitizeInput(inputValidator, input) : null;
  throw error;
}

async function checkClientSupported(
  viewer: Viewer,
  inputValidator: *,
  input: *,
) {
  let platformDetails;
  if (inputValidator) {
    platformDetails = findFirstInputMatchingValidator(
      inputValidator,
      tPlatformDetails,
      input,
    );
  }
  if (!platformDetails && inputValidator) {
    const platform = findFirstInputMatchingValidator(
      inputValidator,
      tPlatform,
      input,
    );
    if (platform) {
      platformDetails = { platform };
    }
  }
  if (!platformDetails) {
    ({ platformDetails } = viewer);
  }
  await verifyClientSupported(viewer, platformDetails);
}

const redactedString = '********';
const redactedTypes = [tPassword, tCookie];
function sanitizeInput(inputValidator: *, input: *) {
  if (!inputValidator) {
    return input;
  }
  if (redactedTypes.includes(inputValidator) && typeof input === 'string') {
    return redactedString;
  }
  if (
    inputValidator.meta.kind === 'maybe' &&
    redactedTypes.includes(inputValidator.meta.type) &&
    typeof input === 'string'
  ) {
    return redactedString;
  }
  if (
    inputValidator.meta.kind !== 'interface' ||
    typeof input !== 'object' ||
    !input
  ) {
    return input;
  }
  const result = {};
  for (const key in input) {
    const value = input[key];
    const validator = inputValidator.meta.props[key];
    result[key] = sanitizeInput(validator, value);
  }
  return result;
}

function findFirstInputMatchingValidator(
  wholeInputValidator: *,
  inputValidatorToMatch: *,
  input: *,
): any {
  if (!wholeInputValidator || input === null || input === undefined) {
    return null;
  }
  if (
    wholeInputValidator === inputValidatorToMatch &&
    wholeInputValidator.is(input)
  ) {
    return input;
  }
  if (wholeInputValidator.meta.kind === 'maybe') {
    return findFirstInputMatchingValidator(
      wholeInputValidator.meta.type,
      inputValidatorToMatch,
      input,
    );
  }
  if (
    wholeInputValidator.meta.kind === 'interface' &&
    typeof input === 'object'
  ) {
    for (const key in input) {
      const value = input[key];
      const validator = wholeInputValidator.meta.props[key];
      const innerResult = findFirstInputMatchingValidator(
        validator,
        inputValidatorToMatch,
        value,
      );
      if (innerResult) {
        return innerResult;
      }
    }
  }
  if (wholeInputValidator.meta.kind === 'union') {
    for (const validator of wholeInputValidator.meta.types) {
      if (validator.is(input)) {
        return findFirstInputMatchingValidator(
          validator,
          inputValidatorToMatch,
          input,
        );
      }
    }
  }
  if (wholeInputValidator.meta.kind === 'list' && Array.isArray(input)) {
    const validator = wholeInputValidator.meta.type;
    for (const value of input) {
      const innerResult = findFirstInputMatchingValidator(
        validator,
        inputValidatorToMatch,
        value,
      );
      if (innerResult) {
        return innerResult;
      }
    }
  }
  return null;
}

async function policiesValidator(
  viewer: Viewer,
  policies: $ReadOnlyArray<PolicyType>,
) {
  if (!policies.length) {
    return;
  }
  if (!hasMinCodeVersion(viewer.platformDetails, 1000)) {
    return;
  }

  const viewerAcknowledgments = await fetchPolicyAcknowledgments(
    viewer,
    policies,
  );
  const notAcknowledgedPolicies = policies.filter(policy => {
    const policyAcknowledgment = viewerAcknowledgments.find(
      viewerAcknowledgment => viewerAcknowledgment.policy === policy,
    );
    return !policyAcknowledgment?.confirmed;
  });

  if (notAcknowledgedPolicies.length) {
    throw new ServerError('policies_not_accepted', {
      notAcknowledgedPolicies,
    });
  }
}

export {
  validateInput,
  checkInputValidator,
  checkClientSupported,
  policiesValidator,
};
