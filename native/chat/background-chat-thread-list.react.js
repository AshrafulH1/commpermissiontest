// @flow

import * as React from 'react';
import { Text, View } from 'react-native';

import { unreadBackgroundCount } from 'lib/selectors/thread-selectors';
import {
  threadInBackgroundChatList,
  emptyItemText,
} from 'lib/shared/thread-utils';

import BackgroundTabIllustration from '../components/background-tab-illustration.react';
import type { NavigationRoute } from '../navigation/route-names';
import { useSelector } from '../redux/redux-utils';
import { useStyles } from '../themes/colors';
import ChatThreadList from './chat-thread-list.react';
import type { ChatTopTabsNavigationProp } from './chat.react';

type BackgroundChatThreadListProps = {|
  navigation: ChatTopTabsNavigationProp<'BackgroundChatThreadList'>,
  route: NavigationRoute<'BackgroundChatThreadList'>,
|};
export default function BackgroundChatThreadList(
  props: BackgroundChatThreadListProps,
) {
  const unreadBackgroundThreadsNumber = useSelector(state =>
    unreadBackgroundCount(state),
  );

  const prevUnreadNumber = React.useRef(0);
  React.useEffect(() => {
    if (unreadBackgroundThreadsNumber === prevUnreadNumber.current) {
      return;
    }
    prevUnreadNumber.current = unreadBackgroundThreadsNumber;
    let title = 'Background';
    if (unreadBackgroundThreadsNumber !== 0) {
      title += ` (${unreadBackgroundThreadsNumber})`;
    }
    props.navigation.setOptions({ title });
  }, [props.navigation, unreadBackgroundThreadsNumber]);

  return (
    <ChatThreadList
      navigation={props.navigation}
      route={props.route}
      filterThreads={threadInBackgroundChatList}
      emptyItem={EmptyItem}
    />
  );
}

function EmptyItem() {
  const styles = useStyles(unboundStyles);
  return (
    <View>
      <View style={styles.container}>
        <BackgroundTabIllustration />
      </View>
      <Text style={styles.emptyList}>{emptyItemText}</Text>
    </View>
  );
}

const unboundStyles = {
  container: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyList: {
    color: 'listBackgroundLabel',
    fontSize: 14,
    marginHorizontal: 20,
    marginVertical: 10,
    textAlign: 'center',
  },
};
