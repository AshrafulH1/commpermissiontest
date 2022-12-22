// @flow

import BottomSheet from '@gorhom/bottom-sheet';
import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import {
  getSIWENonce,
  getSIWENonceActionTypes,
} from 'lib/actions/siwe-actions';
import { registerActionTypes, register } from 'lib/actions/user-actions';
import { createLoadingStatusSelector } from 'lib/selectors/loading-selectors';
import type { LogInStartingPayload } from 'lib/types/account-types';
import {
  useServerCall,
  useDispatchActionPromise,
} from 'lib/utils/action-utils';

import { NavContext } from '../navigation/navigation-context';
import { useSelector } from '../redux/redux-utils';
import { nativeLogInExtraInfoSelector } from '../selectors/account-selectors';
import { defaultLandingURLPrefix } from '../utils/url-utils';
import { setNativeCredentials } from './native-credentials';

const commSIWE = `${defaultLandingURLPrefix}/siwe`;

const getSIWENonceLoadingStatusSelector = createLoadingStatusSelector(
  getSIWENonceActionTypes,
);

function SIWEPanel(): React.Node {
  const navContext = React.useContext(NavContext);
  const dispatchActionPromise = useDispatchActionPromise();
  const registerAction = useServerCall(register);
  const getSIWENonceCall = useServerCall(getSIWENonce);

  const logInExtraInfo = useSelector(state =>
    nativeLogInExtraInfoSelector({
      redux: state,
      navContext,
    }),
  );

  const getSIWENonceCallFailed = useSelector(
    state => getSIWENonceLoadingStatusSelector(state) === 'error',
  );

  const [nonce, setNonce] = React.useState<?string>(null);

  React.useEffect(() => {
    (async () => {
      dispatchActionPromise(
        getSIWENonceActionTypes,
        (async () => {
          const response = await getSIWENonceCall();
          setNonce(response);
        })(),
      );
    })();
  }, [dispatchActionPromise, getSIWENonceCall]);

  const handleSIWE = React.useCallback(
    ({ address, signature }) => {
      // this is all mocked from register-panel
      const extraInfo = logInExtraInfo();
      dispatchActionPromise(
        registerActionTypes,
        registerAction({
          username: address,
          password: signature,
          ...extraInfo,
        }),
        undefined,
        ({ calendarQuery: extraInfo.calendarQuery }: LogInStartingPayload),
      );
      setNativeCredentials({ username: address, password: signature });
    },
    [logInExtraInfo, dispatchActionPromise, registerAction],
  );
  const handleMessage = React.useCallback(
    event => {
      const {
        nativeEvent: { data },
      } = event;
      const { address, signature } = JSON.parse(data);
      if (address && signature) {
        handleSIWE({ address, signature });
      }
    },
    [handleSIWE],
  );

  const source = React.useMemo(
    () => ({
      uri: commSIWE,
      headers: {
        'siwe-nonce': nonce,
      },
    }),
    [nonce],
  );

  const [isLoading, setLoading] = React.useState(true);

  const snapPoints = React.useMemo(() => {
    if (isLoading) {
      return [1];
    } else {
      return [700];
    }
  }, [isLoading]);

  const onWebViewLoaded = React.useCallback(() => {
    setLoading(false);
  }, []);

  const handleStyle = React.useMemo(
    () => ({
      backgroundColor: '#242529',
    }),
    [],
  );

  const bottomSheetHandleIndicatorStyle = React.useMemo(
    () => ({
      backgroundColor: 'white',
    }),
    [],
  );

  let bottomSheet;
  if (nonce) {
    bottomSheet = (
      <BottomSheet
        snapPoints={snapPoints}
        backgroundStyle={handleStyle}
        handleIndicatorStyle={bottomSheetHandleIndicatorStyle}
      >
        <WebView
          source={source}
          onMessage={handleMessage}
          onLoad={onWebViewLoaded}
        />
      </BottomSheet>
    );
  }

  let activity;
  if (getSIWENonceCallFailed) {
    activity = <Text>Oops, try again later!</Text>;
  } else if (isLoading) {
    activity = <ActivityIndicator size="large" />;
  }

  const activityContainer = React.useMemo(
    () => ({
      flex: 1,
    }),
    [],
  );

  return (
    <>
      <View style={activityContainer}>{activity}</View>
      {bottomSheet}
    </>
  );
}

export default SIWEPanel;
