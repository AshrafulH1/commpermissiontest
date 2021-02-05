// @flow

import * as React from 'react';

import { unreadBackgroundCount } from 'lib/selectors/thread-selectors';
import { threadIsTopLevel } from 'lib/shared/thread-utils';

import { useSelector } from '../redux/redux-utils';
import { activeChatThreadItem as activeChatThreadItemSelector } from '../selectors/chat-selectors';
import css from './chat-tabs.css';
import ChatThreadBackground from './chat-thread-background.react';
import ChatThreadHome from './chat-thread-home.react';
import ChatThreadTab from './chat-thread-tab.react';

type Props = {|
  +setModal: (modal: ?React.Node) => void,
|};
function ChatTabs(props: Props) {
  let backgroundTitle = 'BACKGROUND';
  const unreadBackgroundCountVal = useSelector(unreadBackgroundCount);
  if (unreadBackgroundCountVal) {
    backgroundTitle += ` (${unreadBackgroundCountVal})`;
  }

  const [activeTab, setActiveTab] = React.useState('HOME');
  const onClickHome = React.useCallback(() => setActiveTab('HOME'), []);
  const onClickBackground = React.useCallback(
    () => setActiveTab('BACKGROUND'),
    [],
  );

  const activeChatThreadItem = useSelector(activeChatThreadItemSelector);
  const activeThreadInfo = activeChatThreadItem?.threadInfo;
  const activeThreadFromHomeTab =
    activeThreadInfo?.currentUser.subscription.home;
  const activeThreadID = activeThreadInfo?.id;
  const activeThreadHasSpecificTab = threadIsTopLevel(activeThreadInfo);
  const activeThreadIsFromDifferentTab =
    (activeTab === 'BACKGROUND' && activeThreadFromHomeTab) ||
    (activeTab === 'HOME' && !activeThreadFromHomeTab);
  const prevActiveThreadIDRef = React.useRef<?string>();
  const shouldChangeTab =
    activeThreadHasSpecificTab && activeThreadIsFromDifferentTab;
  React.useEffect(() => {
    const prevActiveThreadID = prevActiveThreadIDRef.current;
    prevActiveThreadIDRef.current = activeThreadID;
    if (activeThreadID !== prevActiveThreadID && shouldChangeTab) {
      setActiveTab(activeThreadFromHomeTab ? 'HOME' : 'BACKGROUND');
    }
  }, [activeThreadID, activeThreadFromHomeTab, shouldChangeTab]);

  const threadList =
    activeTab === 'HOME' ? (
      <ChatThreadHome setModal={props.setModal} />
    ) : (
      <ChatThreadBackground setModal={props.setModal} />
    );
  return (
    <div className={css.container}>
      <div className={css.tabs}>
        <ChatThreadTab
          title="HOME"
          tabIsActive={activeTab === 'HOME'}
          onClick={onClickHome}
        />
        <ChatThreadTab
          title={backgroundTitle}
          tabIsActive={activeTab === 'BACKGROUND'}
          onClick={onClickBackground}
        />
      </div>
      <div className={css.threadList}>{threadList}</div>
    </div>
  );
}

export default ChatTabs;
