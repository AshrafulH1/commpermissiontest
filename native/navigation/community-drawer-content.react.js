// @flow

import * as React from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import {
  childThreadInfos,
  communityThreadSelector,
} from 'lib/selectors/thread-selectors';
import { type ThreadInfo, communitySubthreads } from 'lib/types/thread-types';

import { useNavigateToThread } from '../chat/message-list-types';
import { useStyles } from '../themes/colors';
import type { TextStyle } from '../types/styles';
import CommunityDrawerItemCommunity from './community-drawer-item-cummunity.react';

const maxDepth = 2;
const safeAreaEdges = ['top'];

function CommunityDrawerContent(): React.Node {
  const communities = useSelector(communityThreadSelector);
  const communitiesSuffixed = React.useMemo(() => appendSuffix(communities), [
    communities,
  ]);
  const styles = useStyles(unboundStyles);

  const [openCommunity, setOpenCommunity] = React.useState(
    communitiesSuffixed.length === 1 ? communitiesSuffixed[0].id : null,
  );

  const navigateToThread = useNavigateToThread();
  const childThreadInfosMap = useSelector(childThreadInfos);

  const setOpenCommunnityOrClose = React.useCallback((index: string) => {
    setOpenCommunity(open => (open === index ? null : index));
  }, []);

  const renderItem = React.useCallback(
    ({ item }) => {
      const itemData = {
        threadInfo: item.threadInfo,
        itemChildren: item.itemChildren,
        labelStyle: item.labelStyle,
      };
      return (
        <CommunityDrawerItemCommunity
          key={item.key}
          itemData={itemData}
          toggleExpanded={setOpenCommunnityOrClose}
          expanded={itemData.threadInfo.id === openCommunity}
          navigateToThread={navigateToThread}
        />
      );
    },
    [navigateToThread, openCommunity, setOpenCommunnityOrClose],
  );

  const labelStylesObj = useStyles(labelUnboundStyles);
  const labelStyles = React.useMemo(
    () => [
      labelStylesObj.level0Label,
      labelStylesObj.level1Label,
      labelStylesObj.level2Label,
    ],
    [labelStylesObj],
  );

  const drawerItemsData = React.useMemo(
    () =>
      createRecursiveDrawerItemsData(
        childThreadInfosMap,
        communitiesSuffixed,
        labelStyles,
      ),
    [childThreadInfosMap, communitiesSuffixed, labelStyles],
  );

  return (
    <SafeAreaView style={styles.drawerContent} edges={safeAreaEdges}>
      <FlatList data={drawerItemsData} renderItem={renderItem} />
    </SafeAreaView>
  );
}

function createRecursiveDrawerItemsData(
  childThreadInfosMap: { +[id: string]: $ReadOnlyArray<ThreadInfo> },
  communities: $ReadOnlyArray<ThreadInfo>,
  labelStyles: $ReadOnlyArray<TextStyle>,
) {
  const result = communities.map(community => ({
    key: community.id,
    threadInfo: community,
    itemChildren: [],
    labelStyle: labelStyles[0],
  }));
  let queue = result.map(item => [item, 0]);

  for (let i = 0; i < queue.length; i++) {
    const [item, lvl] = queue[i];
    const itemChildThreadInfos = childThreadInfosMap[item.threadInfo.id] ?? [];

    if (lvl < maxDepth) {
      item.itemChildren = itemChildThreadInfos
        .filter(childItem => communitySubthreads.includes(childItem.type))
        .map(childItem => ({
          threadInfo: childItem,
          itemChildren: [],
          labelStyle: labelStyles[Math.min(lvl + 1, labelStyles.length - 1)],
        }));
      queue = queue.concat(
        item.itemChildren.map(childItem => [childItem, lvl + 1]),
      );
    }
  }
  return result;
}

function appendSuffix(chats: $ReadOnlyArray<ThreadInfo>): ThreadInfo[] {
  const result = [];
  const names = new Map<string, number>();

  for (const chat of chats) {
    let name = chat.uiName;
    const numberOfOccurrences = names.get(name);
    names.set(name, (numberOfOccurrences ?? 0) + 1);
    if (numberOfOccurrences) {
      name = `${name} (${numberOfOccurrences.toString()})`;
    }
    result.push({ ...chat, uiName: name });
  }
  return result;
}

const unboundStyles = {
  drawerContent: {
    flex: 1,
    paddingRight: 8,
    paddingTop: 8,
    backgroundColor: 'drawerBackgroud',
  },
};
const labelUnboundStyles = {
  level0Label: {
    color: 'drawerItemLabelLevel0',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  level1Label: {
    color: 'drawerItemLabelLevel1',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  level2Label: {
    color: 'drawerItemLabelLevel2',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
};

const MemoizedCommunityDrawerContent: React.ComponentType<{}> = React.memo(
  CommunityDrawerContent,
);

export default MemoizedCommunityDrawerContent;
