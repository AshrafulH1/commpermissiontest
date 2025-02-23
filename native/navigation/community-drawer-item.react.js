// @flow

import * as React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';

import type { ThreadInfo } from 'lib/types/thread-types';

import type { MessageListParams } from '../chat/message-list-types';
import { SingleLine } from '../components/single-line.react';
import { useStyles } from '../themes/colors';
import type { TextStyle } from '../types/styles';
import { ExpandButton, ExpandButtonDisabled } from './expand-buttons.react';
import SubchannelsButton from './subchannels-button.react';

export type CommunityDrawerItemData = {
  +threadInfo: ThreadInfo,
  +itemChildren?: $ReadOnlyArray<CommunityDrawerItemData>,
  +labelStyle: TextStyle,
  +hasSubchannelsButton: boolean,
};

export type DrawerItemProps = {
  +itemData: CommunityDrawerItemData,
  +toggleExpanded: (threadID: string) => void,
  +expanded: boolean,
  +navigateToThread: (params: MessageListParams) => void,
};

function CommunityDrawerItem(props: DrawerItemProps): React.Node {
  const {
    itemData: { threadInfo, itemChildren, labelStyle, hasSubchannelsButton },
    navigateToThread,
    expanded,
    toggleExpanded,
  } = props;

  const styles = useStyles(unboundStyles);

  const renderItem = React.useCallback(
    ({ item }) => (
      <MemoizedCommunityDrawerItemChat
        key={item.threadInfo.id}
        itemData={item}
        navigateToThread={navigateToThread}
      />
    ),
    [navigateToThread],
  );

  const children = React.useMemo(() => {
    if (!expanded) {
      return null;
    }
    if (hasSubchannelsButton) {
      return (
        <View style={styles.subchannelsButton}>
          <SubchannelsButton threadInfo={threadInfo} />
        </View>
      );
    }
    return <FlatList data={itemChildren} renderItem={renderItem} />;
  }, [
    expanded,
    itemChildren,
    renderItem,
    hasSubchannelsButton,
    styles.subchannelsButton,
    threadInfo,
  ]);

  const onExpandToggled = React.useCallback(() => {
    toggleExpanded(threadInfo.id);
  }, [toggleExpanded, threadInfo.id]);

  const itemExpandButton = React.useMemo(() => {
    if (!itemChildren?.length && !hasSubchannelsButton) {
      return <ExpandButtonDisabled />;
    }
    return <ExpandButton onPress={onExpandToggled} expanded={expanded} />;
  }, [itemChildren?.length, hasSubchannelsButton, onExpandToggled, expanded]);

  const onPress = React.useCallback(() => {
    navigateToThread({ threadInfo });
  }, [navigateToThread, threadInfo]);

  return (
    <View>
      <View style={styles.threadEntry}>
        {itemExpandButton}
        <TouchableOpacity
          onPress={onPress}
          style={styles.textTouchableWrapper}
          onLongPress={onExpandToggled}
        >
          <SingleLine style={labelStyle}>{threadInfo.uiName}</SingleLine>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

const unboundStyles = {
  chatView: {
    marginLeft: 16,
  },
  threadEntry: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  textTouchableWrapper: {
    flex: 1,
  },
  subchannelsButton: {
    marginLeft: 24,
    marginBottom: 6,
  },
};

export type CommunityDrawerItemChatProps = {
  +itemData: CommunityDrawerItemData,
  +navigateToThread: (params: MessageListParams) => void,
};

function CommunityDrawerItemChat(
  props: CommunityDrawerItemChatProps,
): React.Node {
  const [expanded, setExpanded] = React.useState(false);
  const styles = useStyles(unboundStyles);

  const toggleExpanded = React.useCallback(() => {
    setExpanded(isExpanded => !isExpanded);
  }, []);

  return (
    <View style={styles.chatView}>
      <CommunityDrawerItem
        {...props}
        expanded={expanded}
        toggleExpanded={toggleExpanded}
      />
    </View>
  );
}
const MemoizedCommunityDrawerItemChat: React.ComponentType<CommunityDrawerItemChatProps> = React.memo(
  CommunityDrawerItemChat,
);

const MemoizedCommunityDrawerItem: React.ComponentType<DrawerItemProps> = React.memo(
  CommunityDrawerItem,
);

export default MemoizedCommunityDrawerItem;
