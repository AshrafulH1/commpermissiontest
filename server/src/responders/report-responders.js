// @flow

import {
  type ReportCreationResponse,
  type ReportCreationRequest,
  type FetchErrorReportInfosResponse,
  type FetchErrorReportInfosRequest,
  reportTypes,
} from 'lib/types/report-types';
import type { Viewer } from '../session/viewer';
import type { $Response, $Request } from 'express';

import t from 'tcomb';

import { ServerError } from 'lib/utils/errors';

import {
  validateInput,
  tShape,
  tPlatform,
  tPlatformDetails,
} from '../utils/validation-utils';
import createReport from '../creators/report-creator';
import {
  fetchErrorReportInfos,
  fetchReduxToolsImport,
} from '../fetchers/report-fetchers';

const reportCreationRequestInputValidator = t.union([
  tShape({
    type: t.maybe(t.irreducible(
      'reportTypes.ERROR',
      x => x === reportTypes.ERROR,
    )),
    platformDetails: t.maybe(tPlatformDetails),
    deviceType: t.maybe(tPlatform),
    codeVersion: t.maybe(t.Number),
    stateVersion: t.maybe(t.Number),
    errors: t.list(tShape({
      errorMessage: t.String,
      componentStack: t.maybe(t.String),
    })),
    preloadedState: t.Object,
    currentState: t.Object,
    actions: t.list(t.Object),
  }),
  tShape({
    type: t.irreducible(
      'reportTypes.THREAD_POLL_PUSH_INCONSISTENCY',
      x => x === reportTypes.THREAD_POLL_PUSH_INCONSISTENCY,
    ),
    platformDetails: tPlatformDetails,
    beforeAction: t.Object,
    action: t.Object,
    pollResult: t.Object,
    pushResult: t.Object,
    lastActionTypes: t.maybe(t.list(t.String)),
    time: t.maybe(t.Number),
  }),
]);

async function reportCreationResponder(
  viewer: Viewer,
  input: any,
): Promise<ReportCreationResponse> {
  validateInput(reportCreationRequestInputValidator, input);
  if (input.type === null || input.type === undefined) {
    input.type = reportTypes.ERROR;
  }
  if (!input.platformDetails && input.deviceType) {
    const { deviceType, codeVersion, stateVersion, ...rest } = input;
    input = {
      ...rest,
      platformDetails: { platform: deviceType, codeVersion, stateVersion },
    };
  }
  const request: ReportCreationRequest = input;
  const response = await createReport(viewer, request);
  if (!response) {
    throw new ServerError('ignored_report');
  }
  return response;
}

const fetchErrorReportInfosRequestInputValidator = tShape({
  cursor: t.maybe(t.String),
});

async function errorReportFetchInfosResponder(
  viewer: Viewer,
  input: any,
): Promise<FetchErrorReportInfosResponse> {
  const request: FetchErrorReportInfosRequest = input;
  validateInput(fetchErrorReportInfosRequestInputValidator, request);
  return await fetchErrorReportInfos(viewer, request);
}

async function errorReportDownloadHandler(
  viewer: Viewer,
  req: $Request,
  res: $Response,
): Promise<void> {
  const id = req.params.reportID;
  if (!id) {
    throw new ServerError('invalid_parameters');
  }
  const result = await fetchReduxToolsImport(viewer, id);
  res.set("Content-Disposition", `attachment; filename=report-${id}.json`);
  res.json({
    preloadedState: JSON.stringify(result.preloadedState),
    payload: JSON.stringify(result.payload),
  });
}

export {
  reportCreationResponder,
  errorReportFetchInfosResponder,
  errorReportDownloadHandler,
};
