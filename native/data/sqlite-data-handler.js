// @flow

import * as React from 'react';
import { Alert } from 'react-native';
import ExitApp from 'react-native-exit-app';
import { useDispatch } from 'react-redux';

import { setClientDBStoreActionType } from 'lib/actions/client-db-store-actions';
import { isLoggedIn } from 'lib/selectors/user-selectors';
import { logInActionSources } from 'lib/types/account-types';
import { fetchNewCookieFromNativeCredentials } from 'lib/utils/action-utils';
import { getMessageForException } from 'lib/utils/errors';
import { convertClientDBThreadInfosToRawThreadInfos } from 'lib/utils/thread-ops-utils';

import { commCoreModule } from '../native-modules';
import { setStoreLoadedActionType } from '../redux/action-types';
import { useSelector } from '../redux/redux-utils';
import { StaffContext } from '../staff/staff-context';
import { isTaskCancelledError } from '../utils/error-handling';
import { useStaffCanSee } from '../utils/staff-utils';

function SQLiteDataHandler(): React.Node {
  const storeLoaded = useSelector(state => state.storeLoaded);

  const dispatch = useDispatch();
  const rehydrateConcluded = useSelector(
    state => !!(state._persist && state._persist.rehydrated),
  );
  const cookie = useSelector(state => state.cookie);
  const urlPrefix = useSelector(state => state.urlPrefix);
  const staffCanSee = useStaffCanSee();
  const { staffUserHasBeenLoggedIn } = React.useContext(StaffContext);
  const loggedIn = useSelector(isLoggedIn);
  const currentLoggedInUserID = useSelector(state =>
    state.currentUserInfo?.anonymous ? undefined : state.currentUserInfo?.id,
  );

  const handleSensitiveData = React.useCallback(async () => {
    try {
      const databaseCurrentUserInfoID = await commCoreModule.getCurrentUserID();
      if (
        databaseCurrentUserInfoID &&
        databaseCurrentUserInfoID !== currentLoggedInUserID
      ) {
        if (staffCanSee || staffUserHasBeenLoggedIn) {
          Alert.alert('Starting SQLite database deletion process');
        }
        await commCoreModule.clearSensitiveData();
        if (staffCanSee || staffUserHasBeenLoggedIn) {
          Alert.alert(
            'SQLite database successfully deleted',
            'SQLite database deletion was triggered by change in logged-in user credentials',
          );
        }
      }
      if (currentLoggedInUserID) {
        await commCoreModule.setCurrentUserID(currentLoggedInUserID);
      }
      const databaseDeviceID = await commCoreModule.getDeviceID();
      if (!databaseDeviceID) {
        await commCoreModule.setDeviceID('MOBILE');
      }
    } catch (e) {
      if (isTaskCancelledError(e)) {
        return;
      }
      if (__DEV__) {
        throw e;
      } else {
        console.log(e);
        ExitApp.exitApp();
      }
    }
  }, [currentLoggedInUserID, staffCanSee, staffUserHasBeenLoggedIn]);

  React.useEffect(() => {
    if (!rehydrateConcluded) {
      return;
    }
    const sensitiveDataHandled = handleSensitiveData();
    if (storeLoaded) {
      return;
    }
    if (!loggedIn) {
      dispatch({ type: setStoreLoadedActionType });
      return;
    }
    (async () => {
      await sensitiveDataHandled;
      try {
        const {
          threads,
          messages,
          drafts,
        } = await commCoreModule.getClientDBStore();
        const threadInfosFromDB = convertClientDBThreadInfosToRawThreadInfos(
          threads,
        );
        dispatch({
          type: setClientDBStoreActionType,
          payload: {
            drafts,
            messages,
            threadStore: { threadInfos: threadInfosFromDB },
            currentUserID: currentLoggedInUserID,
          },
        });
      } catch (setStoreException) {
        if (isTaskCancelledError(setStoreException)) {
          dispatch({ type: setStoreLoadedActionType });
          return;
        }
        if (staffCanSee) {
          Alert.alert(
            `Error setting threadStore or messageStore: ${
              getMessageForException(setStoreException) ??
              '{no exception message}'
            }`,
          );
        }
        try {
          await fetchNewCookieFromNativeCredentials(
            dispatch,
            cookie,
            urlPrefix,
            logInActionSources.sqliteLoadFailure,
          );
          dispatch({ type: setStoreLoadedActionType });
        } catch (fetchCookieException) {
          if (staffCanSee) {
            Alert.alert(
              `Error fetching new cookie from native credentials: ${
                getMessageForException(fetchCookieException) ??
                '{no exception message}'
              }. Please kill the app.`,
            );
          } else {
            ExitApp.exitApp();
          }
        }
      }
    })();
  }, [
    currentLoggedInUserID,
    handleSensitiveData,
    loggedIn,
    cookie,
    dispatch,
    rehydrateConcluded,
    staffCanSee,
    storeLoaded,
    urlPrefix,
  ]);

  return null;
}

export { SQLiteDataHandler };
