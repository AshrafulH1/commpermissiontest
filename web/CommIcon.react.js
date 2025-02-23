// @flow

import * as React from 'react';
import IcomoonReact from 'react-icomoon';

import iconSet from 'lib/shared/comm-icon-config.json';

export type CommIcons =
  | 'cloud-filled'
  | 'sidebar'
  | 'sidebar-filled'
  | 'reply'
  | 'reply-filled'
  | 'megaphone'
  | 'copy-filled';

type CommIconProps = {
  +icon: CommIcons,
  +size: number | string,
  +color?: string,
  +title?: string,
  +className?: string,
  +disableFill?: boolean,
  +removeInlineStyle?: boolean,
};

const iconStyle = {
  stroke: 'none',
};

function CommIcon(props: CommIconProps): React.Node {
  return <IcomoonReact {...props} style={iconStyle} iconSet={iconSet} />;
}

export default CommIcon;
