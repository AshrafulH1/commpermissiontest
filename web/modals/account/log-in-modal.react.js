// @flow

import type { AppState } from '../../redux-setup';
import type { DispatchActionPromise } from 'lib/utils/action-utils';
import type {
  LogInInfo,
  LogInExtraInfo,
  LogInResult,
} from 'lib/types/account-types';

import * as React from 'react';
import invariant from 'invariant';
import PropTypes from 'prop-types';

import {
  validUsernameRegex,
  validEmailRegex,
} from 'lib/shared/account-regexes';
import { connect } from 'lib/utils/redux-utils';
import { logInActionTypes, logIn } from 'lib/actions/user-actions';
import { createLoadingStatusSelector } from 'lib/selectors/loading-selectors';
import { logInExtraInfoSelector } from 'lib/selectors/account-selectors';

import css from '../../style.css';
import Modal from '../modal.react';
import ForgotPasswordModal from './forgot-password-modal.react';

type Props = {
  setModal: (modal: ?React.Node) => void,
  // Redux state
  inputDisabled: bool,
  logInExtraInfo: () => LogInExtraInfo,
  // Redux dispatch functions
  dispatchActionPromise: DispatchActionPromise,
  // async functions that hit server APIs
  logIn: (logInInfo: LogInInfo) => Promise<LogInResult>,
};
type State = {
  usernameOrEmail: string,
  password: string,
  errorMessage: string,
};

class LogInModal extends React.PureComponent<Props, State> {

  usernameOrEmailInput: ?HTMLInputElement;
  passwordInput: ?HTMLInputElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      usernameOrEmail: "",
      password: "",
      errorMessage: "",
    };
  }

  componentDidMount() {
    invariant(this.usernameOrEmailInput, "usernameOrEmail ref unset");
    this.usernameOrEmailInput.focus();
  }

  render() {
    return (
      <Modal name="Log in" onClose={this.clearModal}>
        <div className={css['modal-body']}>
          <form method="POST">
            <div>
              <div className={css['form-title']}>Username</div>
              <div className={css['form-content']}>
                <input
                  type="text"
                  placeholder="Username or email"
                  value={this.state.usernameOrEmail}
                  onChange={this.onChangeUsernameOrEmail}
                  ref={this.usernameOrEmailInputRef}
                  disabled={this.props.inputDisabled}
                />
              </div>
            </div>
            <div>
              <div className={css['form-title']}>Password</div>
              <div className={css['form-content']}>
                <input
                  type="password"
                  placeholder="Password"
                  value={this.state.password}
                  onChange={this.onChangePassword}
                  ref={this.passwordInputRef}
                  disabled={this.props.inputDisabled}
                />
                <div className={css['form-subtitle']}>
                  <a href="#" onClick={this.onClickForgotPassword}>
                    Forgot password?
                  </a>
                </div>
              </div>
            </div>
            <div className={css['form-footer']}>
              <span className={css['modal-form-error']}>
                {this.state.errorMessage}
              </span>
              <span className={css['form-submit']}>
                <input
                  type="submit"
                  value="Log in"
                  onClick={this.onSubmit}
                  disabled={this.props.inputDisabled}
                />
              </span>
            </div>
          </form>
        </div>
      </Modal>
    );
  }

  usernameOrEmailInputRef = (usernameOrEmailInput: ?HTMLInputElement) => {
    this.usernameOrEmailInput = usernameOrEmailInput;
  }

  passwordInputRef = (passwordInput: ?HTMLInputElement) => {
    this.passwordInput = passwordInput;
  }

  onChangeUsernameOrEmail = (event: SyntheticEvent<HTMLInputElement>) => {
    const target = event.target;
    invariant(target instanceof HTMLInputElement, "target not input");
    this.setState({ usernameOrEmail: target.value });
  }

  onChangePassword = (event: SyntheticEvent<HTMLInputElement>) => {
    const target = event.target;
    invariant(target instanceof HTMLInputElement, "target not input");
    this.setState({ password: target.value });
  }

  onClickForgotPassword = (event: SyntheticEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    this.props.setModal(<ForgotPasswordModal setModal={this.props.setModal} />);
  }

  onSubmit = (event: SyntheticEvent<HTMLInputElement>) => {
    event.preventDefault();

    if (
      this.state.usernameOrEmail.search(validUsernameRegex) === -1 &&
      this.state.usernameOrEmail.search(validEmailRegex) === -1
    ) {
      this.setState(
        {
          usernameOrEmail: "",
          errorMessage: "alphanumeric usernames or emails only",
        },
        () => {
          invariant(
            this.usernameOrEmailInput,
            "usernameOrEmailInput ref unset",
          );
          this.usernameOrEmailInput.focus();
        },
      );
      return;
    }

    const extraInfo = this.props.logInExtraInfo();
    this.props.dispatchActionPromise(
      logInActionTypes,
      this.logInAction(extraInfo),
      undefined,
      { calendarQuery: extraInfo.calendarQuery },
    );
  }

  async logInAction(extraInfo: LogInExtraInfo) {
    try {
      const result = await this.props.logIn({
        usernameOrEmail: this.state.usernameOrEmail,
        password: this.state.password,
        ...extraInfo,
      });
      this.clearModal();
      return result;
    } catch (e) {
      if (e.message === 'invalid_parameters') {
        this.setState(
          {
            usernameOrEmail: "",
            errorMessage: "user doesn't exist",
          },
          () => {
            invariant(
              this.usernameOrEmailInput,
              "usernameOrEmailInput ref unset",
            );
            this.usernameOrEmailInput.focus();
          },
        );
      } else if (e.message === 'invalid_credentials') {
        this.setState(
          {
            password: "",
            errorMessage: "wrong password",
          },
          () => {
            invariant(this.passwordInput, "passwordInput ref unset");
            this.passwordInput.focus();
          },
        );
      } else {
        this.setState(
          {
            usernameOrEmail: "",
            password: "",
            errorMessage: "unknown error",
          },
          () => {
            invariant(
              this.usernameOrEmailInput,
              "usernameOrEmailInput ref unset",
            );
            this.usernameOrEmailInput.focus();
          },
        );
      }
      throw e;
    }
  }

  clearModal = () => {
    this.props.setModal(null);
  }

}

LogInModal.propTypes = {
  setModal: PropTypes.func.isRequired,
  inputDisabled: PropTypes.bool.isRequired,
  logInExtraInfo: PropTypes.func.isRequired,
  dispatchActionPromise: PropTypes.func.isRequired,
  logIn: PropTypes.func.isRequired,
};

const loadingStatusSelector = createLoadingStatusSelector(logInActionTypes);

export default connect(
  (state: AppState) => ({
    inputDisabled: loadingStatusSelector(state) === "loading",
    logInExtraInfo: logInExtraInfoSelector(state),
  }),
  { logIn },
)(LogInModal);
