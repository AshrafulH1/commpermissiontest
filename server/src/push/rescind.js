// @flow

import { threadPermissions } from 'lib/types/thread-types';
import { threadSubscriptions } from 'lib/types/subscription-types';

import apn from 'apn';
import invariant from 'invariant';

import { promiseAll } from 'lib/utils/promises';

import { dbQuery, SQL, SQLStatement } from '../database';
import { apnPush, fcmPush } from './utils';
import createIDs from '../creators/id-creator';

async function rescindPushNotifs(
  notifCondition: SQLStatement,
  inputCountCondition?: SQLStatement,
) {
  const notificationExtractString = `$.${threadSubscriptions.home}`;
  const visPermissionExtractString = `$.${threadPermissions.VISIBLE}.value`;
  const fetchQuery = SQL`
    SELECT n.id, n.user, n.thread, n.message, n.delivery, n.collapse_key, COUNT(
  `;
  fetchQuery.append(inputCountCondition ? inputCountCondition : SQL`m.thread`);
  fetchQuery.append(SQL`
      ) AS unread_count
    FROM notifications n
    LEFT JOIN memberships m ON m.user = n.user AND m.unread = 1 AND m.role > 0 
      AND JSON_EXTRACT(subscription, ${notificationExtractString})
      AND JSON_EXTRACT(permissions, ${visPermissionExtractString})
    WHERE n.rescinded = 0 AND
  `);
  fetchQuery.append(notifCondition);
  fetchQuery.append(SQL` GROUP BY n.id, m.user`);
  const [fetchResult] = await dbQuery(fetchQuery);

  const deliveryPromises = {};
  const notifInfo = {};
  const rescindedIDs = [];
  for (let row of fetchResult) {
    const deliveries = Array.isArray(row.delivery)
      ? row.delivery
      : [row.delivery];
    const id = row.id.toString();
    const threadID = row.thread.toString();
    notifInfo[id] = {
      userID: row.user.toString(),
      threadID,
      messageID: row.message.toString(),
    };
    for (let delivery of deliveries) {
      if (delivery.iosID && delivery.iosDeviceTokens) {
        // Old iOS
        const notification = prepareIOSNotification(
          delivery.iosID,
          row.unread_count,
        );
        deliveryPromises[id] = apnPush(notification, delivery.iosDeviceTokens);
      } else if (delivery.androidID) {
        // Old Android
        const notification = prepareAndroidNotification(
          row.collapse_key ? row.collapse_key : id,
          row.unread_count,
          threadID,
          null,
        );
        deliveryPromises[id] = fcmPush(
          notification,
          delivery.androidDeviceTokens,
          null,
        );
      } else if (delivery.deviceType === 'ios') {
        // New iOS
        const { iosID, deviceTokens } = delivery;
        const notification = prepareIOSNotification(iosID, row.unread_count);
        deliveryPromises[id] = apnPush(notification, deviceTokens);
      } else if (delivery.deviceType === 'android') {
        // New Android
        const { deviceTokens, codeVersion } = delivery;
        const notification = prepareAndroidNotification(
          row.collapse_key ? row.collapse_key : id,
          row.unread_count,
          threadID,
          codeVersion,
        );
        deliveryPromises[id] = fcmPush(notification, deviceTokens, null);
      }
    }
    rescindedIDs.push(row.id);
  }

  const numRescinds = Object.keys(deliveryPromises).length;
  const promises = [promiseAll(deliveryPromises)];
  if (numRescinds > 0) {
    promises.push(createIDs('notifications', numRescinds));
  }
  if (rescindedIDs.length > 0) {
    const rescindQuery = SQL`
      UPDATE notifications SET rescinded = 1 WHERE id IN (${rescindedIDs})
    `;
    promises.push(dbQuery(rescindQuery));
  }

  const [deliveryResults, dbIDs] = await Promise.all(promises);
  const newNotifRows = [];
  if (numRescinds > 0) {
    invariant(dbIDs, 'dbIDs should be set');
    for (const rescindedID in deliveryResults) {
      const delivery = {};
      delivery.type = 'rescind';
      delivery.rescindedID = rescindedID;
      const { errors } = deliveryResults[rescindedID];
      if (errors) {
        delivery.errors = errors;
      }
      const dbID = dbIDs.shift();
      const { userID, threadID, messageID } = notifInfo[rescindedID];
      newNotifRows.push([
        dbID,
        userID,
        threadID,
        messageID,
        null,
        JSON.stringify([delivery]),
        1,
      ]);
    }
  }
  if (newNotifRows.length > 0) {
    const insertQuery = SQL`
      INSERT INTO notifications
        (id, user, thread, message, collapse_key, delivery, rescinded)
      VALUES ${newNotifRows}
    `;
    await dbQuery(insertQuery);
  }
}

function prepareIOSNotification(
  iosID: string,
  unreadCount: number,
): apn.Notification {
  const notification = new apn.Notification();
  notification.contentAvailable = true;
  notification.badge = unreadCount;
  notification.topic = 'org.squadcal.app';
  notification.payload = {
    managedAps: {
      action: 'CLEAR',
      notificationId: iosID,
    },
  };
  return notification;
}

function prepareAndroidNotification(
  notifID: string,
  unreadCount: number,
  threadID: string,
  codeVersion: ?number,
): Object {
  if (!codeVersion || codeVersion < 31) {
    return {
      data: {
        badge: unreadCount.toString(),
        custom_notification: JSON.stringify({
          rescind: 'true',
          notifID,
        }),
      },
    };
  }
  return {
    data: {
      badge: unreadCount.toString(),
      rescind: 'true',
      rescindID: notifID,
      threadID,
    },
  };
}

export { rescindPushNotifs };
