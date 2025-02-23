// @flow
import classNames from 'classnames';
import * as React from 'react';

import { useModalContext } from 'lib/components/modal-provider.react';
import type { ChatThreadItem } from 'lib/selectors/chat-selectors';
import { getMessagePreview } from 'lib/shared/message-utils';
import { shortAbsoluteDate } from 'lib/utils/date-utils';

import Button from '../../../components/button.react';
import { getDefaultTextMessageRules } from '../../../markdown/rules.react';
import { useOnClickThread } from '../../../selectors/thread-selectors';
import css from './sidebars-modal.css';

type Props = {
  +sidebar: ChatThreadItem,
  +isLastItem?: boolean,
};

function Sidebar(props: Props): React.Node {
  const { sidebar, isLastItem } = props;
  const { threadInfo, lastUpdatedTime, mostRecentMessageInfo } = sidebar;
  const { unread } = threadInfo.currentUser;

  const { popModal } = useModalContext();

  const navigateToThread = useOnClickThread(threadInfo);

  const onClickThread = React.useCallback(
    event => {
      popModal();
      navigateToThread(event);
    },
    [popModal, navigateToThread],
  );

  const sidebarInfoClassName = classNames({
    [css.sidebarInfo]: true,
    [css.unread]: unread,
  });

  const lastActivity = React.useMemo(() => shortAbsoluteDate(lastUpdatedTime), [
    lastUpdatedTime,
  ]);

  const lastMessage = React.useMemo(() => {
    if (!mostRecentMessageInfo) {
      return <div className={css.noMessage}>No messages</div>;
    }
    const { message, username } = getMessagePreview(
      mostRecentMessageInfo,
      threadInfo,
      getDefaultTextMessageRules().simpleMarkdownRules,
    );
    const previewText = username ? `${username}: ${message}` : message;
    return (
      <>
        <div className={css.longTextEllipsis}>{previewText}</div>
        <div className={css.lastActivity}>{lastActivity}</div>
      </>
    );
  }, [lastActivity, mostRecentMessageInfo, threadInfo]);

  return (
    <Button className={css.sidebarContainer} onClick={onClickThread}>
      <img
        className={css.sidebarArrow}
        src={
          isLastItem
            ? 'images/arrow_sidebar_last.svg'
            : 'images/arrow_sidebar.svg'
        }
        alt="sidebar arrow"
      />
      <div className={sidebarInfoClassName}>
        <div className={css.longTextEllipsis}>{threadInfo.uiName}</div>
        <div className={css.lastMessage}>{lastMessage}</div>
      </div>
    </Button>
  );
}

export default Sidebar;
