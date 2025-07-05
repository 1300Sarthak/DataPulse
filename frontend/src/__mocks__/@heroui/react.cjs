/* eslint-disable no-undef */
const React = require('react');

module.exports = {
  Button: ({ children, ...props }) => (
    React.createElement('button', { ...props, 'data-testid': 'heroui-button' }, children)
  ),
  Spinner: (props) => (
    React.createElement('div', { ...props, 'data-testid': 'heroui-spinner' }, 'Loading...')
  ),
  Switch: (props) => (
    React.createElement('input', { type: 'checkbox', ...props, 'data-testid': 'heroui-switch' })
  ),
  Dropdown: ({ children, ...props }) => (
    React.createElement('div', { ...props, 'data-testid': 'heroui-dropdown' }, children)
  ),
  DropdownTrigger: ({ children, ...props }) => (
    React.createElement('div', { ...props, 'data-testid': 'heroui-dropdown-trigger' }, children)
  ),
  DropdownMenu: ({ children, ...props }) => (
    React.createElement('div', { ...props, 'data-testid': 'heroui-dropdown-menu' }, children)
  ),
  DropdownItem: ({ children, ...props }) => (
    React.createElement('div', { ...props, 'data-testid': 'heroui-dropdown-item' }, children)
  ),
  Card: ({ children, ...props }) => (
    React.createElement('div', { ...props, 'data-testid': 'heroui-card' }, children)
  ),
  CardBody: ({ children, ...props }) => (
    React.createElement('div', { ...props, 'data-testid': 'heroui-card-body' }, children)
  ),
  Chip: ({ children, ...props }) => (
    React.createElement('span', { ...props, 'data-testid': 'heroui-chip' }, children)
  ),
  Link: ({ children, ...props }) => (
    React.createElement('a', { ...props, 'data-testid': 'heroui-link' }, children)
  ),
  Skeleton: (props) => (
    React.createElement('div', { ...props, 'data-testid': 'heroui-skeleton' }, 'Loading...')
  ),
  Divider: (props) => React.createElement('hr', { ...props, 'data-testid': 'heroui-divider' }),
  Badge: ({ children, ...props }) => (
    React.createElement('span', { ...props, 'data-testid': 'heroui-badge' }, children)
  ),
}; 