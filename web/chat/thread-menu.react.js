// @flow

import {
  faArrowRight,
  faBell,
  faCog,
  faCommentAlt,
  faSignOutAlt,
  faPlusCircle,
  faUserFriends,
} from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';

import {
  leaveThread,
  leaveThreadActionTypes,
} from 'lib/actions/thread-actions';
import { childThreadInfos } from 'lib/selectors/thread-selectors';
import {
  threadHasPermission,
  viewerIsMember,
  threadIsChannel,
} from 'lib/shared/thread-utils';
import {
  type ThreadInfo,
  threadTypes,
  threadPermissions,
} from 'lib/types/thread-types';
import {
  useServerCall,
  useDispatchActionPromise,
} from 'lib/utils/action-utils';

import SidebarListModal from '../modals/chat/sidebar-list-modal.react';
import { useModalContext } from '../modals/modal-provider.react';
import ConfirmLeaveThreadModal from '../modals/threads/confirm-leave-thread-modal.react';
import ThreadSettingsModal from '../modals/threads/thread-settings-modal.react';
import { useSelector } from '../redux/redux-utils';
import SWMansionIcon from '../SWMansionIcon.react';
import ThreadMenuItem from './thread-menu-item.react';
import css from './thread-menu.css';

type ThreadMenuProps = {
  +threadInfo: ThreadInfo,
};

function ThreadMenu(props: ThreadMenuProps): React.Node {
  const [isOpen, setIsOpen] = React.useState(false);

  const { setModal, clearModal } = useModalContext();

  const { threadInfo } = props;

  const onClickSettings = React.useCallback(
    () => setModal(<ThreadSettingsModal threadID={threadInfo.id} />),
    [setModal, threadInfo.id],
  );

  const settingsItem = React.useMemo(() => {
    return (
      <ThreadMenuItem
        key="settings"
        text="Settings"
        icon={faCog}
        onClick={onClickSettings}
      />
    );
  }, [onClickSettings]);

  const membersItem = React.useMemo(() => {
    if (threadInfo.type === threadTypes.PERSONAL) {
      return null;
    }
    return <ThreadMenuItem key="members" text="Members" icon={faUserFriends} />;
  }, [threadInfo.type]);

  const childThreads = useSelector(
    state => childThreadInfos(state)[threadInfo.id],
  );

  const hasSidebars = React.useMemo(() => {
    return childThreads?.some(
      childThreadInfo => childThreadInfo.type === threadTypes.SIDEBAR,
    );
  }, [childThreads]);

  const onClickSidebars = React.useCallback(
    () => setModal(<SidebarListModal threadInfo={threadInfo} />),
    [setModal, threadInfo],
  );

  const sidebarItem = React.useMemo(() => {
    if (!hasSidebars) {
      return null;
    }
    return (
      <ThreadMenuItem
        key="sidebars"
        text="Sidebars"
        icon={faArrowRight}
        onClick={onClickSidebars}
      />
    );
  }, [hasSidebars, onClickSidebars]);

  const canCreateSubchannels = React.useMemo(
    () => threadHasPermission(threadInfo, threadPermissions.CREATE_SUBCHANNELS),
    [threadInfo],
  );

  const hasSubchannels = React.useMemo(() => {
    return !!childThreads?.some(threadIsChannel);
  }, [childThreads]);

  const viewSubchannelsItem = React.useMemo(() => {
    if (!hasSubchannels && !canCreateSubchannels) {
      return null;
    }
    return (
      <ThreadMenuItem
        key="subchannels"
        text="Subchannels"
        icon={faCommentAlt}
      />
    );
  }, [canCreateSubchannels, hasSubchannels]);

  const createSubchannelsItem = React.useMemo(() => {
    if (!canCreateSubchannels) {
      return null;
    }
    return (
      <ThreadMenuItem
        key="newSubchannel"
        text="Create new subchannel"
        icon={faPlusCircle}
      />
    );
  }, [canCreateSubchannels]);

  const dispatchActionPromise = useDispatchActionPromise();
  const callLeaveThread = useServerCall(leaveThread);

  const onConfirmLeaveThread = React.useCallback(() => {
    dispatchActionPromise(
      leaveThreadActionTypes,
      callLeaveThread(threadInfo.id),
    );
    clearModal();
  }, [callLeaveThread, clearModal, dispatchActionPromise, threadInfo.id]);

  const onClickLeaveThread = React.useCallback(
    () =>
      setModal(
        <ConfirmLeaveThreadModal
          threadInfo={threadInfo}
          onClose={clearModal}
          onConfirm={onConfirmLeaveThread}
        />,
      ),
    [clearModal, onConfirmLeaveThread, setModal, threadInfo],
  );

  const leaveThreadItem = React.useMemo(() => {
    const canLeaveThread = threadHasPermission(
      threadInfo,
      threadPermissions.LEAVE_THREAD,
    );
    if (!viewerIsMember(threadInfo) || !canLeaveThread) {
      return null;
    }
    return (
      <ThreadMenuItem
        key="leave"
        text="Leave Thread"
        icon={faSignOutAlt}
        dangerous
        onClick={onClickLeaveThread}
      />
    );
  }, [onClickLeaveThread, threadInfo]);

  const menuItems = React.useMemo(() => {
    const notificationsItem = (
      <ThreadMenuItem key="notifications" text="Notifications" icon={faBell} />
    );
    const separator = <hr key="separator" className={css.separator} />;

    // TODO: Enable menu items when the modals are implemented
    const SHOW_NOTIFICATIONS = false;
    const SHOW_MEMBERS = false;
    const SHOW_VIEW_SUBCHANNELS = false;
    const SHOW_CREATE_SUBCHANNELS = false;

    const items = [
      settingsItem,
      SHOW_NOTIFICATIONS && notificationsItem,
      SHOW_MEMBERS && membersItem,
      sidebarItem,
      SHOW_VIEW_SUBCHANNELS && viewSubchannelsItem,
      SHOW_CREATE_SUBCHANNELS && createSubchannelsItem,
      leaveThreadItem && separator,
      leaveThreadItem,
    ];
    return items.filter(Boolean);
  }, [
    settingsItem,
    membersItem,
    sidebarItem,
    viewSubchannelsItem,
    createSubchannelsItem,
    leaveThreadItem,
  ]);

  const closeMenuCallback = React.useCallback(() => {
    document.removeEventListener('click', closeMenuCallback);
    if (isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!document || !isOpen) {
      return undefined;
    }
    document.addEventListener('click', closeMenuCallback);
    return () => document.removeEventListener('click', closeMenuCallback);
  }, [closeMenuCallback, isOpen]);

  const switchMenuCallback = React.useCallback(() => {
    setIsOpen(isMenuOpen => !isMenuOpen);
  }, []);

  if (menuItems.length === 0) {
    return null;
  }

  let menuActionList = null;
  if (isOpen) {
    menuActionList = (
      <div className={css.topBarMenuActionList}>{menuItems}</div>
    );
  }

  return (
    <div>
      <button className={css.topBarMenuButton} onClick={switchMenuCallback}>
        <SWMansionIcon icon="menu-vertical" size={20} />
      </button>
      {menuActionList}
    </div>
  );
}

export default ThreadMenu;