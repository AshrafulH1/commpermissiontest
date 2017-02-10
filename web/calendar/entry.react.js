// @flow

import type { EntryInfo } from 'lib/types/entry-types';
import { entryInfoPropType } from 'lib/types/entry-types';
import type { CalendarInfo } from 'lib/types/calendar-types';
import { calendarInfoPropType } from 'lib/types/calendar-types';
import type { LoadingStatus } from 'lib/types/loading-types';
import type { AppState } from '../redux-setup';
import type {
  DispatchActionPayload,
  DispatchActionPromise,
} from 'lib/utils/action-utils';

import React from 'react';
import classNames from 'classnames';
import invariant from 'invariant';
import { connect } from 'react-redux';

import { colorIsDark } from 'lib/selectors/calendar-selectors';
import fetchJSON from 'lib/utils/fetch-json';
import { includeDispatchActionProps } from 'lib/utils/action-utils';
import {
  saveEntryActionType,
  concurrentModificationResetActionType,
  saveEntry,
  deleteEntryActionType,
  deleteEntry,
} from 'lib/actions/entry-actions';
import { ServerError } from 'lib/utils/fetch-utils';

import css from '../style.css';
import LoadingIndicator from '../loading-indicator.react';
import ConcurrentModificationModal from
  '../modals/concurrent-modification-modal.react';
import HistoryModal from '../modals/history/history-modal.react';
import { HistoryVector, DeleteVector } from '../vectors.react';
import LogInFirstModal from '../modals/account/log-in-first-modal.react';

type Props = {
  innerRef: (me: Entry) => void,
  entryInfo: EntryInfo,
  calendarInfo: CalendarInfo,
  sessionID: string,
  loggedIn: bool,
  focusOnFirstEntryNewerThan: (time: number) => void,
  setModal: (modal: React.Element<any>) => void,
  clearModal: () => void,
  tabIndex: number,
  dispatchActionPayload: DispatchActionPayload,
  dispatchActionPromise: DispatchActionPromise,
};
type State = {
  focused: bool,
  loadingStatus: LoadingStatus,
  text: string,
};

class Entry extends React.Component {

  props: Props;
  state: State;
  textarea: ?HTMLTextAreaElement;
  creating: bool;
  needsUpdateAfterCreation: bool;
  needsDeleteAfterCreation: bool;
  nextSaveAttemptIndex: number;
  mounted: bool;

  constructor(props: Props) {
    super(props);
    this.state = {
      focused: false,
      loadingStatus: "inactive",
      text: props.entryInfo.text,
    };
    this.creating = false;
    this.needsUpdateAfterCreation = false;
    this.needsDeleteAfterCreation = false;
    this.nextSaveAttemptIndex = 0;
    this.mounted = true;
  }

  componentDidMount() {
    this.props.innerRef(this);
    this.updateHeight();
    // Whenever a new Entry is created, focus on it
    if (!this.props.entryInfo.id) {
      this.focus();
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (
      !this.state.focused &&
        this.props.entryInfo.text !== nextProps.entryInfo.text
    ) {
      this.setState({ text: nextProps.entryInfo.text });
    }
  }

  focus() {
    invariant(
      this.textarea instanceof HTMLTextAreaElement,
      "textarea ref not set",
    );
    this.textarea.focus();
  }

  onMouseDown(event: SyntheticEvent) {
    if (this.state.focused) {
      // Don't lose focus when some non-textarea part is clicked
      event.preventDefault();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  updateHeight() {
    invariant(
      this.textarea instanceof HTMLTextAreaElement,
      "textarea ref not set",
    );
    this.textarea.style.height = 'auto';
    this.textarea.style.height = (this.textarea.scrollHeight) + 'px';
  }

  render() {
    let actionLinks = null;
    if (this.state.focused) {
      let historyButton = null;
      if (this.props.entryInfo.id) {
        historyButton = (
          <a
            href="#"
            className={css['entry-history-button']}
            onClick={this.onHistory.bind(this)}
          >
            <HistoryVector className={css['history']} />
            <span className={css['action-links-text']}>History</span>
          </a>
        );
      }
      actionLinks = (
        <div className={css['action-links']}>
          <a
            href="#"
            className={css['delete-entry-button']}
            onClick={this.onDelete.bind(this)}
          >
            <DeleteVector className={css['delete']} />
            <span className={css['action-links-text']}>Delete</span>
          </a>
          {historyButton}
          <span className={
            `${css['right-action-links']} ${css['action-links-text']}`
          }>
            {this.props.calendarInfo.name}
          </span>
          <div className={css['clear']}></div>
        </div>
      );
    }

    const entryClasses = classNames({
      [css['entry']]: true,
      [css['dark-entry']]: colorIsDark(this.props.calendarInfo.color),
      [css['focused-entry']]: this.state.focused,
    });
    const style = { backgroundColor: "#" + this.props.calendarInfo.color };
    return (
      <div
        className={entryClasses}
        style={style}
        onMouseDown={this.onMouseDown.bind(this)}
      >
        <textarea
          rows="1"
          className={css['entry-text']}
          onChange={this.onChange.bind(this)}
          onKeyDown={this.onKeyDown.bind(this)}
          value={this.state.text}
          onFocus={() => this.setState({ focused: true })}
          onBlur={this.onBlur.bind(this)}
          tabIndex={this.props.tabIndex}
          ref={(textarea) => this.textarea = textarea}
        />
        <LoadingIndicator
          status={this.state.loadingStatus}
          className={css['entry-loading']}
        />
        {actionLinks}
      </div>
    );
  }

  async onBlur(event: SyntheticEvent) {
    this.setState({ focused: false });
    invariant(
      this.textarea instanceof HTMLTextAreaElement,
      "textarea ref not set",
    );
    if (this.textarea.value.trim() === "") {
      this.delete(this.props.entryInfo.id, false);
    }
  }

  onChange(event: SyntheticEvent) {
    if (this.props.calendarInfo.editRules >= 1 && !this.props.loggedIn) {
      this.props.setModal(
        <LogInFirstModal
          inOrderTo="edit this calendar"
          onClose={this.props.clearModal}
          setModal={this.props.setModal}
        />
      );
      return;
    }
    const target = event.target;
    invariant(target instanceof HTMLTextAreaElement, "target not textarea");
    this.setState(
      { "text": target.value },
      this.updateHeight.bind(this),
    );
    this.save(this.props.entryInfo.id, target.value);
  }

  // Throw away typechecking here because SyntheticEvent isn't typed
  onKeyDown(event: any) {
    if (event.keyCode === 27) {
      invariant(
        this.textarea instanceof HTMLTextAreaElement,
        "textarea ref not set",
      );
      this.textarea.blur();
    }
  }

  save(serverID: ?string, newText: string) {
    if (newText.trim() === "") {
      // We don't save the empty string, since as soon as the element loses
      // focus it'll get deleted
      return;
    }

    if (!serverID) {
      if (this.creating) {
        // We need the first save call to return so we know the ID of the entry
        // we're updating, so we'll need to handle this save later
        this.needsUpdateAfterCreation = true;
        return;
      } else {
        this.creating = true;
      }
    }

    this.props.dispatchActionPromise(
      saveEntryActionType,
      this.saveAction(serverID, newText),
    );
  }

  async saveAction(serverID: ?string, newText: string) {
    const curSaveAttempt = this.nextSaveAttemptIndex++;
    if (this.mounted) {
      this.setState({ loadingStatus: "loading" });
    }
    try {
      const response = await saveEntry(
        serverID,
        newText,
        this.props.entryInfo.text,
        this.props.sessionID,
        this.props.entryInfo.year,
        this.props.entryInfo.month,
        this.props.entryInfo.day,
        this.props.entryInfo.calendarID,
        this.props.entryInfo.creationTime,
      );
      if (this.mounted && curSaveAttempt + 1 === this.nextSaveAttemptIndex) {
        this.setState({ loadingStatus: "inactive" });
      }
      const payload = {
        localID: (null: ?string),
        serverID: serverID ? serverID : response.entry_id.toString(),
        day: this.props.entryInfo.day,
        text: newText,
      }
      if (!serverID && response.entry_id) {
        const localID = this.props.entryInfo.localID;
        invariant(localID, "if there's no serverID, there should be a localID");
        payload.localID = localID;
        const newServerID = response.entry_id.toString();
        this.creating = false;
        if (this.needsUpdateAfterCreation) {
          this.needsUpdateAfterCreation = false;
          this.save(newServerID, this.state.text);
        }
        if (this.needsDeleteAfterCreation) {
          this.needsDeleteAfterCreation = false;
          this.delete(newServerID, false);
        }
      }
      return payload;
    } catch(e) {
      if (this.mounted && curSaveAttempt + 1 === this.nextSaveAttemptIndex) {
        this.setState({ loadingStatus: "error" });
      }
      if (e instanceof ServerError && e.message === 'concurrent_modification') {
        invariant(serverID, "serverID should be set");
        const onRefresh = () => {
          this.setState(
            { loadingStatus: "inactive" },
            this.updateHeight.bind(this),
          );
          this.props.dispatchActionPayload(
            concurrentModificationResetActionType,
            { serverID, day: this.props.entryInfo.day, dbText: e.result.db },
          );
          this.props.clearModal();
        };
        this.props.setModal(
          <ConcurrentModificationModal
            onClose={this.props.clearModal}
            onRefresh={onRefresh}
          />
        );
      }
      throw e;
    }
  }

  onDelete(event: SyntheticEvent) {
    event.preventDefault();
    if (this.props.calendarInfo.editRules >= 1 && !this.props.loggedIn) {
      this.props.setModal(
        <LogInFirstModal
          inOrderTo="edit this calendar"
          onClose={this.props.clearModal}
          setModal={this.props.setModal}
        />
      );
      return;
    }
    this.delete(this.props.entryInfo.id, true);
  }

  delete(serverID: ?string, focusOnNextEntry: bool) {
    this.props.dispatchActionPromise(
      deleteEntryActionType,
      this.deleteAction(serverID, focusOnNextEntry),
      undefined,
      {
        localID: this.props.entryInfo.localID,
        serverID: serverID,
        day: this.props.entryInfo.day,
      },
    );
  }

  async deleteAction(serverID: ?string, focusOnNextEntry: bool) {
    invariant(
      this.props.calendarInfo.editRules < 1 || this.props.loggedIn,
      "calendar should be editable if delete triggered",
    );
    if (focusOnNextEntry) {
      this.props.focusOnFirstEntryNewerThan(this.props.entryInfo.creationTime);
    }
    if (serverID) {
      await deleteEntry(
        serverID,
        this.props.entryInfo.text,
        this.props.sessionID,
      );
    } else if (this.creating) {
      this.needsDeleteAfterCreation = true;
    }
  }

  onHistory(event: SyntheticEvent) {
    event.preventDefault();
    this.props.setModal(
      <HistoryModal
        mode="entry"
        year={this.props.entryInfo.year}
        month={this.props.entryInfo.month}
        day={this.props.entryInfo.day}
        onClose={this.props.clearModal}
        currentEntryID={this.props.entryInfo.id}
      />
    );
  }

}

export type InnerEntry = Entry;

Entry.propTypes = {
  innerRef: React.PropTypes.func.isRequired,
  entryInfo: entryInfoPropType.isRequired,
  calendarInfo: calendarInfoPropType.isRequired,
  sessionID: React.PropTypes.string.isRequired,
  loggedIn: React.PropTypes.bool.isRequired,
  focusOnFirstEntryNewerThan: React.PropTypes.func.isRequired,
  setModal: React.PropTypes.func.isRequired,
  clearModal: React.PropTypes.func.isRequired,
  tabIndex: React.PropTypes.number.isRequired,
  dispatchActionPayload: React.PropTypes.func.isRequired,
  dispatchActionPromise: React.PropTypes.func.isRequired,
}

type OwnProps = {
  entryInfo: EntryInfo,
};
export default connect(
  (state: AppState, ownProps: OwnProps) => ({
    calendarInfo: state.calendarInfos[ownProps.entryInfo.calendarID],
    sessionID: state.sessionID,
    loggedIn: !!state.userInfo,
  }),
  includeDispatchActionProps({
    dispatchActionPromise: true,
    dispatchActionPayload: true,
  }),
)(Entry);
