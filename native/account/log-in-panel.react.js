// @flow

import invariant from 'invariant';
import * as React from 'react';
import { View, StyleSheet, Alert, Keyboard, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';

import { logInActionTypes, logIn } from 'lib/actions/user-actions';
import { createLoadingStatusSelector } from 'lib/selectors/loading-selectors';
import {
  validEmailRegex,
  oldValidUsernameRegex,
} from 'lib/shared/account-utils';
import type {
  LogInInfo,
  LogInExtraInfo,
  LogInResult,
  LogInStartingPayload,
} from 'lib/types/account-types';
import type { LoadingStatus } from 'lib/types/loading-types';
import {
  useServerCall,
  useDispatchActionPromise,
  type DispatchActionPromise,
} from 'lib/utils/action-utils';

import { NavContext } from '../navigation/navigation-context';
import { useSelector } from '../redux/redux-utils';
import { nativeLogInExtraInfoSelector } from '../selectors/account-selectors';
import type { StateContainer } from '../utils/state-container';
import { TextInput } from './modal-components.react';
import {
  fetchNativeCredentials,
  setNativeCredentials,
} from './native-credentials';
import { PanelButton, Panel } from './panel-components.react';

export type LogInState = {|
  +usernameInputText: ?string,
  +passwordInputText: ?string,
|};
type BaseProps = {|
  +setActiveAlert: (activeAlert: boolean) => void,
  +opacityValue: Animated.Value,
  +logInState: StateContainer<LogInState>,
|};
type Props = {|
  ...BaseProps,
  // Redux state
  +loadingStatus: LoadingStatus,
  +logInExtraInfo: () => LogInExtraInfo,
  // Redux dispatch functions
  +dispatchActionPromise: DispatchActionPromise,
  // async functions that hit server APIs
  +logIn: (logInInfo: LogInInfo) => Promise<LogInResult>,
|};
class LogInPanel extends React.PureComponent<Props> {
  usernameInput: ?TextInput;
  passwordInput: ?TextInput;

  componentDidMount() {
    this.attemptToFetchCredentials();
  }

  get usernameInputText(): string {
    return this.props.logInState.state.usernameInputText || '';
  }

  get passwordInputText(): string {
    return this.props.logInState.state.passwordInputText || '';
  }

  async attemptToFetchCredentials() {
    if (
      this.props.logInState.state.usernameInputText !== null &&
      this.props.logInState.state.usernameInputText !== undefined
    ) {
      return;
    }
    const credentials = await fetchNativeCredentials();
    if (!credentials) {
      return;
    }
    if (
      this.props.logInState.state.usernameInputText !== null &&
      this.props.logInState.state.usernameInputText !== undefined
    ) {
      return;
    }
    this.props.logInState.setState({
      usernameInputText: credentials.username,
      passwordInputText: credentials.password,
    });
  }

  render() {
    return (
      <Panel opacityValue={this.props.opacityValue}>
        <View>
          <Icon name="user" size={22} color="#777" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={this.usernameInputText}
            onChangeText={this.onChangeUsernameInputText}
            onKeyPress={this.onUsernameKeyPress}
            placeholder="Username"
            autoFocus={Platform.OS !== 'ios'}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="ascii-capable"
            textContentType="username"
            autoCompleteType="username"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={this.focusPasswordInput}
            editable={this.props.loadingStatus !== 'loading'}
            ref={this.usernameInputRef}
          />
        </View>
        <View>
          <Icon name="lock" size={22} color="#777" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={this.passwordInputText}
            onChangeText={this.onChangePasswordInputText}
            placeholder="Password"
            secureTextEntry={true}
            textContentType="password"
            autoCompleteType="password"
            returnKeyType="go"
            blurOnSubmit={false}
            onSubmitEditing={this.onSubmit}
            editable={this.props.loadingStatus !== 'loading'}
            ref={this.passwordInputRef}
          />
        </View>
        <PanelButton
          text="LOG IN"
          loadingStatus={this.props.loadingStatus}
          onSubmit={this.onSubmit}
        />
      </Panel>
    );
  }

  usernameInputRef = (usernameInput: ?TextInput) => {
    this.usernameInput = usernameInput;
    if (Platform.OS === 'ios' && usernameInput) {
      setTimeout(() => usernameInput.focus());
    }
  };

  focusUsernameInput = () => {
    invariant(this.usernameInput, 'ref should be set');
    this.usernameInput.focus();
  };

  passwordInputRef = (passwordInput: ?TextInput) => {
    this.passwordInput = passwordInput;
  };

  focusPasswordInput = () => {
    invariant(this.passwordInput, 'ref should be set');
    this.passwordInput.focus();
  };

  onChangeUsernameInputText = (text: string) => {
    this.props.logInState.setState({ usernameInputText: text });
  };

  onUsernameKeyPress = (
    event: $ReadOnly<{ nativeEvent: $ReadOnly<{ key: string }> }>,
  ) => {
    const { key } = event.nativeEvent;
    if (
      key.length > 1 &&
      key !== 'Backspace' &&
      key !== 'Enter' &&
      this.passwordInputText.length === 0
    ) {
      this.focusPasswordInput();
    }
  };

  onChangePasswordInputText = (text: string) => {
    this.props.logInState.setState({ passwordInputText: text });
  };

  onSubmit = () => {
    this.props.setActiveAlert(true);
    if (this.usernameInputText.search(validEmailRegex)) {
      Alert.alert(
        "Can't log in with email",
        'You need to log in with your username now',
        [{ text: 'OK', onPress: this.onUsernameAlertAcknowledged }],
        { cancelable: false },
      );
      return;
    } else if (this.usernameInputText.search(oldValidUsernameRegex) === -1) {
      Alert.alert(
        'Invalid username',
        'Alphanumeric usernames only',
        [{ text: 'OK', onPress: this.onUsernameAlertAcknowledged }],
        { cancelable: false },
      );
      return;
    } else if (this.passwordInputText === '') {
      Alert.alert(
        'Empty password',
        'Password cannot be empty',
        [{ text: 'OK', onPress: this.onPasswordAlertAcknowledged }],
        { cancelable: false },
      );
      return;
    }

    Keyboard.dismiss();
    const extraInfo = this.props.logInExtraInfo();
    this.props.dispatchActionPromise(
      logInActionTypes,
      this.logInAction(extraInfo),
      undefined,
      ({ calendarQuery: extraInfo.calendarQuery }: LogInStartingPayload),
    );
  };

  onUsernameAlertAcknowledged = () => {
    this.props.setActiveAlert(false);
    this.props.logInState.setState(
      {
        usernameInputText: '',
      },
      this.focusUsernameInput,
    );
  };

  async logInAction(extraInfo: LogInExtraInfo) {
    try {
      const result = await this.props.logIn({
        username: this.usernameInputText,
        password: this.passwordInputText,
        ...extraInfo,
      });
      this.props.setActiveAlert(false);
      await setNativeCredentials({
        username: result.currentUserInfo.username,
        password: this.passwordInputText,
      });
      return result;
    } catch (e) {
      if (e.message === 'invalid_parameters') {
        Alert.alert(
          'Invalid username',
          "User doesn't exist",
          [{ text: 'OK', onPress: this.onUsernameAlertAcknowledged }],
          { cancelable: false },
        );
      } else if (e.message === 'invalid_credentials') {
        Alert.alert(
          'Incorrect password',
          'The password you entered is incorrect',
          [{ text: 'OK', onPress: this.onPasswordAlertAcknowledged }],
          { cancelable: false },
        );
      } else if (e.message === 'client_version_unsupported') {
        const app = Platform.select({
          ios: 'Testflight',
          android: 'Play Store',
        });
        Alert.alert(
          'App out of date',
          "Your app version is pretty old, and the server doesn't know how " +
            `to speak to it anymore. Please use the ${app} app to update!`,
          [{ text: 'OK', onPress: this.onAppOutOfDateAlertAcknowledged }],
          { cancelable: false },
        );
      } else {
        Alert.alert(
          'Unknown error',
          'Uhh... try again?',
          [{ text: 'OK', onPress: this.onUnknownErrorAlertAcknowledged }],
          { cancelable: false },
        );
      }
      throw e;
    }
  }

  onPasswordAlertAcknowledged = () => {
    this.props.setActiveAlert(false);
    this.props.logInState.setState(
      {
        passwordInputText: '',
      },
      this.focusPasswordInput,
    );
  };

  onUnknownErrorAlertAcknowledged = () => {
    this.props.setActiveAlert(false);
    this.props.logInState.setState(
      {
        usernameInputText: '',
        passwordInputText: '',
      },
      this.focusUsernameInput,
    );
  };

  onAppOutOfDateAlertAcknowledged = () => {
    this.props.setActiveAlert(false);
  };
}

export type InnerLogInPanel = LogInPanel;

const styles = StyleSheet.create({
  icon: {
    bottom: 8,
    left: 4,
    position: 'absolute',
  },
  input: {
    paddingLeft: 35,
  },
});

const loadingStatusSelector = createLoadingStatusSelector(logInActionTypes);

export default React.memo<BaseProps>(function ConnectedLogInPanel(
  props: BaseProps,
) {
  const loadingStatus = useSelector(loadingStatusSelector);

  const navContext = React.useContext(NavContext);
  const logInExtraInfo = useSelector((state) =>
    nativeLogInExtraInfoSelector({
      redux: state,
      navContext,
    }),
  );

  const dispatchActionPromise = useDispatchActionPromise();
  const callLogIn = useServerCall(logIn);

  return (
    <LogInPanel
      {...props}
      loadingStatus={loadingStatus}
      logInExtraInfo={logInExtraInfo}
      dispatchActionPromise={dispatchActionPromise}
      logIn={callLogIn}
    />
  );
});
