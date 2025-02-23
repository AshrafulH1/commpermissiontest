// @flow

import * as React from 'react';

import Button from '../components/button.react';
import Input, { type BaseInputProps } from '../modals/input.react';
import SWMansionIcon, { type Icon } from '../SWMansionIcon.react';
import css from './password-input.css';

type PasswordInputProps = BaseInputProps;

function PasswordInput(props: PasswordInputProps, ref): React.Node {
  const [htmlInputType, setHtmlInputType] = React.useState<'password' | 'text'>(
    'password',
  );

  const onToggleShowPassword = React.useCallback(() => {
    setHtmlInputType(oldType => (oldType === 'password' ? 'text' : 'password'));
  }, []);

  const icon: Icon = htmlInputType === 'password' ? 'eye-open' : 'eye-closed';

  return (
    <div className={css.wrapper}>
      <Input
        className={css.input}
        {...props}
        placeholder="Password"
        type={htmlInputType}
        ref={ref}
      />
      <Button className={css.button} onClick={onToggleShowPassword}>
        <SWMansionIcon size={24} icon={icon} />
      </Button>
    </div>
  );
}

const ForwardedPasswordInput: React.AbstractComponent<
  PasswordInputProps,
  HTMLInputElement,
> = React.forwardRef<PasswordInputProps, HTMLInputElement>(PasswordInput);

export default ForwardedPasswordInput;
