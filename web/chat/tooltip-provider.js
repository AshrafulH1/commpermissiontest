// @flow

import classNames from 'classnames';
import invariant from 'invariant';
import * as React from 'react';

import type { TooltipPositionStyle } from './tooltip-utils';
import css from './tooltip.css';

const onMouseLeaveSourceDisappearTimeoutMs = 200;
const onMouseLeaveTooltipDisappearTimeoutMs = 100;

export type RenderTooltipParams = {
  +newNode: React.Node,
  +tooltipPositionStyle: TooltipPositionStyle,
};

export type RenderTooltipResult = {
  +onMouseLeaveCallback: () => mixed,
  +clearTooltip: () => mixed,
};

type TooltipContextType = {
  +renderTooltip: (params: RenderTooltipParams) => RenderTooltipResult,
  +clearTooltip: () => mixed,
};

const TooltipContext: React.Context<TooltipContextType> = React.createContext<TooltipContextType>(
  {
    renderTooltip: () => ({
      onMouseLeaveCallback: () => {},
      clearTooltip: () => {},
    }),
    clearTooltip: () => {},
  },
);

type Props = {
  +children: React.Node,
};
function TooltipProvider(props: Props): React.Node {
  const { children } = props;
  // eslint-disable-next-line no-unused-vars
  const tooltipSymbol = React.useRef<?symbol>(null);
  // eslint-disable-next-line no-unused-vars
  const tooltipCancelTimer = React.useRef<?TimeoutID>(null);

  // eslint-disable-next-line no-unused-vars
  const [tooltipNode, setTooltipNode] = React.useState<React.Node>(null);
  const [
    // eslint-disable-next-line no-unused-vars
    tooltipPosition,
    // eslint-disable-next-line no-unused-vars
    setTooltipPosition,
  ] = React.useState<?TooltipPositionStyle>(null);

  const clearTooltip = React.useCallback((tooltipToClose: symbol) => {
    if (tooltipSymbol.current !== tooltipToClose) {
      return;
    }
    tooltipCancelTimer.current = null;
    setTooltipNode(null);
    setTooltipPosition(null);
    tooltipSymbol.current = null;
  }, []);

  const clearCurrentTooltip = React.useCallback(() => {
    if (tooltipSymbol.current) {
      clearTooltip(tooltipSymbol.current);
    }
  }, [clearTooltip]);

  const renderTooltip = React.useCallback(
    ({
      newNode,
      tooltipPositionStyle: newTooltipPosition,
    }: RenderTooltipParams): RenderTooltipResult => {
      setTooltipNode(newNode);
      setTooltipPosition(newTooltipPosition);
      const newNodeSymbol = Symbol();
      tooltipSymbol.current = newNodeSymbol;

      if (tooltipCancelTimer.current) {
        clearTimeout(tooltipCancelTimer.current);
      }

      return {
        onMouseLeaveCallback: () => {
          const newTimer = setTimeout(
            () => clearTooltip(newNodeSymbol),
            onMouseLeaveSourceDisappearTimeoutMs,
          );
          tooltipCancelTimer.current = newTimer;
        },
        clearTooltip: () => clearTooltip(newNodeSymbol),
      };
    },
    [clearTooltip],
  );

  // eslint-disable-next-line no-unused-vars
  const onMouseEnterTooltip = React.useCallback(() => {
    if (tooltipSymbol.current) {
      clearTimeout(tooltipCancelTimer.current);
    }
  }, []);

  // eslint-disable-next-line no-unused-vars
  const onMouseLeaveTooltip = React.useCallback(() => {
    const timer = setTimeout(
      clearCurrentTooltip,
      onMouseLeaveTooltipDisappearTimeoutMs,
    );
    tooltipCancelTimer.current = timer;
  }, [clearCurrentTooltip]);

  const tooltip = React.useMemo(() => {
    if (!tooltipNode || !tooltipPosition) {
      return null;
    }
    const tooltipContainerStyle = {
      position: 'absolute',
      top: tooltipPosition.yCoord,
      left: tooltipPosition.xCoord,
    };

    const { verticalPosition, horizontalPosition } = tooltipPosition;

    const tooltipClassName = classNames(css.tooltipAbsolute, {
      [css.tooltipAbsoluteLeft]: horizontalPosition === 'right',
      [css.tooltipAbsoluteRight]: horizontalPosition === 'left',
      [css.tooltipAbsoluteTop]: verticalPosition === 'bottom',
      [css.tooltipAbsoluteBottom]: verticalPosition === 'top',
    });

    return (
      <div style={tooltipContainerStyle}>
        <div
          className={tooltipClassName}
          onMouseEnter={onMouseEnterTooltip}
          onMouseLeave={onMouseLeaveTooltip}
        >
          {tooltipNode}
        </div>
      </div>
    );
  }, [onMouseEnterTooltip, onMouseLeaveTooltip, tooltipNode, tooltipPosition]);

  const value = React.useMemo(
    () => ({
      renderTooltip,
      clearTooltip: clearCurrentTooltip,
    }),
    [renderTooltip, clearCurrentTooltip],
  );

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {tooltip}
    </TooltipContext.Provider>
  );
}

function useTooltipContext(): TooltipContextType {
  const context = React.useContext(TooltipContext);
  invariant(context, 'TooltipContext not found');

  return context;
}

export { TooltipProvider, useTooltipContext };
