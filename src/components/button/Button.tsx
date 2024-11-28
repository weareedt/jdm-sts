import React from 'react';
import './Button.scss';

import { Icon } from 'react-feather';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: Icon;
  iconSrc?: string;
  iconPosition?: 'start' | 'end';
  iconColor?: 'red' | 'green' | 'grey';
  iconFill?: boolean;
  buttonStyle?: 'regular' | 'action' | 'alert' | 'flush';
}

export function Button({
  label,
  icon = void 0,
  iconSrc = void 0,
  iconPosition = 'start',
  iconColor = void 0,
  iconFill = false,
  buttonStyle = 'regular',
  ...rest
}: ButtonProps) {
  const StartIcon = iconPosition === 'start' ? icon : null;
  const EndIcon = iconPosition === 'end' ? icon : null;
  const classList = [];
  if (iconColor) {
    classList.push(`icon-${iconColor}`);
  }
  if (iconFill) {
    classList.push(`icon-fill`);
  }
  classList.push(`button-style-${buttonStyle}`);

  return (
    <button data-component="Button" className={classList.join(' ')} {...rest}>
      {StartIcon && (
        <span className="icon icon-start">
          <StartIcon />
        </span>
      )}
      {iconSrc && (
        <img src={iconSrc} alt="Icon" style={{ width: '24px', height: '24px' }} />
      )}
      {label && <span className="label">{label}</span>}
      {EndIcon && (
        <span className="icon icon-end">
          <EndIcon />
        </span>
      )}
    </button>
  );
}
