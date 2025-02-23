// @flow

import invariant from 'invariant';

import type {
  FetchMessageInfosPayload,
  SendMessageResult,
  SendReactionMessageRequest,
  SimpleMessagesPayload,
} from '../types/message-types';
import type { MediaMessageServerDBContent } from '../types/messages/media.js';
import type {
  CallServerEndpoint,
  CallServerEndpointResultInfo,
} from '../utils/call-server-endpoint';

const fetchMessagesBeforeCursorActionTypes = Object.freeze({
  started: 'FETCH_MESSAGES_BEFORE_CURSOR_STARTED',
  success: 'FETCH_MESSAGES_BEFORE_CURSOR_SUCCESS',
  failed: 'FETCH_MESSAGES_BEFORE_CURSOR_FAILED',
});
const fetchMessagesBeforeCursor = (
  callServerEndpoint: CallServerEndpoint,
): ((
  threadID: string,
  beforeMessageID: string,
) => Promise<FetchMessageInfosPayload>) => async (
  threadID,
  beforeMessageID,
) => {
  const response = await callServerEndpoint('fetch_messages', {
    cursors: {
      [threadID]: beforeMessageID,
    },
  });
  return {
    threadID,
    rawMessageInfos: response.rawMessageInfos,
    truncationStatus: response.truncationStatuses[threadID],
  };
};

const fetchMostRecentMessagesActionTypes = Object.freeze({
  started: 'FETCH_MOST_RECENT_MESSAGES_STARTED',
  success: 'FETCH_MOST_RECENT_MESSAGES_SUCCESS',
  failed: 'FETCH_MOST_RECENT_MESSAGES_FAILED',
});
const fetchMostRecentMessages = (
  callServerEndpoint: CallServerEndpoint,
): ((
  threadID: string,
) => Promise<FetchMessageInfosPayload>) => async threadID => {
  const response = await callServerEndpoint('fetch_messages', {
    cursors: {
      [threadID]: null,
    },
  });
  return {
    threadID,
    rawMessageInfos: response.rawMessageInfos,
    truncationStatus: response.truncationStatuses[threadID],
  };
};

const fetchSingleMostRecentMessagesFromThreadsActionTypes = Object.freeze({
  started: 'FETCH_SINGLE_MOST_RECENT_MESSAGES_FROM_THREADS_STARTED',
  success: 'FETCH_SINGLE_MOST_RECENT_MESSAGES_FROM_THREADS_SUCCESS',
  failed: 'FETCH_SINGLE_MOST_RECENT_MESSAGES_FROM_THREADS_FAILED',
});
const fetchSingleMostRecentMessagesFromThreads = (
  callServerEndpoint: CallServerEndpoint,
): ((
  threadIDs: $ReadOnlyArray<string>,
) => Promise<SimpleMessagesPayload>) => async threadIDs => {
  const cursors = Object.fromEntries(
    threadIDs.map(threadID => [threadID, null]),
  );
  const response = await callServerEndpoint('fetch_messages', {
    cursors,
    numberPerThread: 1,
  });
  return {
    rawMessageInfos: response.rawMessageInfos,
    truncationStatuses: response.truncationStatuses,
  };
};

const sendTextMessageActionTypes = Object.freeze({
  started: 'SEND_TEXT_MESSAGE_STARTED',
  success: 'SEND_TEXT_MESSAGE_SUCCESS',
  failed: 'SEND_TEXT_MESSAGE_FAILED',
});
const sendTextMessage = (
  callServerEndpoint: CallServerEndpoint,
): ((
  threadID: string,
  localID: string,
  text: string,
) => Promise<SendMessageResult>) => async (threadID, localID, text) => {
  let resultInfo;
  const getResultInfo = (passedResultInfo: CallServerEndpointResultInfo) => {
    resultInfo = passedResultInfo;
  };
  const response = await callServerEndpoint(
    'create_text_message',
    {
      threadID,
      localID,
      text,
    },
    { getResultInfo },
  );
  const resultInterface = resultInfo?.interface;
  invariant(
    resultInterface,
    'getResultInfo not called before callServerEndpoint resolves',
  );
  return {
    id: response.newMessageInfo.id,
    time: response.newMessageInfo.time,
    interface: resultInterface,
  };
};

const createLocalMessageActionType = 'CREATE_LOCAL_MESSAGE';

const sendMultimediaMessageActionTypes = Object.freeze({
  started: 'SEND_MULTIMEDIA_MESSAGE_STARTED',
  success: 'SEND_MULTIMEDIA_MESSAGE_SUCCESS',
  failed: 'SEND_MULTIMEDIA_MESSAGE_FAILED',
});
const sendMultimediaMessage = (
  callServerEndpoint: CallServerEndpoint,
): ((
  threadID: string,
  localID: string,
  mediaMessageContents: $ReadOnlyArray<MediaMessageServerDBContent>,
) => Promise<SendMessageResult>) => async (
  threadID,
  localID,
  mediaMessageContents,
) => {
  let resultInfo;
  const getResultInfo = (passedResultInfo: CallServerEndpointResultInfo) => {
    resultInfo = passedResultInfo;
  };
  const response = await callServerEndpoint(
    'create_multimedia_message',
    {
      threadID,
      localID,
      mediaMessageContents,
    },
    { getResultInfo },
  );
  const resultInterface = resultInfo?.interface;
  invariant(
    resultInterface,
    'getResultInfo not called before callServerEndpoint resolves',
  );
  return {
    id: response.newMessageInfo.id,
    time: response.newMessageInfo.time,
    interface: resultInterface,
  };
};

const legacySendMultimediaMessage = (
  callServerEndpoint: CallServerEndpoint,
): ((
  threadID: string,
  localID: string,
  mediaIDs: $ReadOnlyArray<string>,
) => Promise<SendMessageResult>) => async (threadID, localID, mediaIDs) => {
  let resultInfo;
  const getResultInfo = (passedResultInfo: CallServerEndpointResultInfo) => {
    resultInfo = passedResultInfo;
  };
  const response = await callServerEndpoint(
    'create_multimedia_message',
    {
      threadID,
      localID,
      mediaIDs,
    },
    { getResultInfo },
  );
  const resultInterface = resultInfo?.interface;
  invariant(
    resultInterface,
    'getResultInfo not called before callServerEndpoint resolves',
  );
  return {
    id: response.newMessageInfo.id,
    time: response.newMessageInfo.time,
    interface: resultInterface,
  };
};

const sendReactionMessageActionTypes = Object.freeze({
  started: 'SEND_REACTION_MESSAGE_STARTED',
  success: 'SEND_REACTION_MESSAGE_SUCCESS',
  failed: 'SEND_REACTION_MESSAGE_FAILED',
});
const sendReactionMessage = (
  callServerEndpoint: CallServerEndpoint,
): ((
  request: SendReactionMessageRequest,
) => Promise<SendMessageResult>) => async request => {
  let resultInfo;
  const getResultInfo = (passedResultInfo: CallServerEndpointResultInfo) => {
    resultInfo = passedResultInfo;
  };

  const response = await callServerEndpoint(
    'create_reaction_message',
    {
      threadID: request.threadID,
      localID: request.localID,
      targetMessageID: request.targetMessageID,
      reaction: request.reaction,
      action: request.action,
    },
    { getResultInfo },
  );

  const resultInterface = resultInfo?.interface;
  invariant(
    resultInterface,
    'getResultInfo not called before callServerEndpoint resolves',
  );

  return {
    id: response.newMessageInfo.id,
    time: response.newMessageInfo.time,
    interface: resultInterface,
  };
};

const saveMessagesActionType = 'SAVE_MESSAGES';
const processMessagesActionType = 'PROCESS_MESSAGES';
const messageStorePruneActionType = 'MESSAGE_STORE_PRUNE';

export {
  fetchMessagesBeforeCursorActionTypes,
  fetchMessagesBeforeCursor,
  fetchMostRecentMessagesActionTypes,
  fetchMostRecentMessages,
  fetchSingleMostRecentMessagesFromThreadsActionTypes,
  fetchSingleMostRecentMessagesFromThreads,
  sendTextMessageActionTypes,
  sendTextMessage,
  createLocalMessageActionType,
  sendMultimediaMessageActionTypes,
  sendMultimediaMessage,
  legacySendMultimediaMessage,
  sendReactionMessageActionTypes,
  sendReactionMessage,
  saveMessagesActionType,
  processMessagesActionType,
  messageStorePruneActionType,
};
