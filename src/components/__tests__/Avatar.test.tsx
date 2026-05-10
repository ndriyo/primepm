import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar — C4 contract', () => {
  // (1) Image present → renders <img> with src/alt and lazy/no-referrer
  it('renders <img> with correct attributes when url is provided', () => {
    render(
      <Avatar
        url="https://lh3.googleusercontent.com/abc"
        name="Daniela Reyes"
        email="daniela@northwind.co"
      />,
    );
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://lh3.googleusercontent.com/abc');
    expect(img.alt).toBe('Daniela Reyes');
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  // (2) url empty/null + name present → name-derived initials
  it('renders name-derived initials when url is null', () => {
    render(
      <Avatar url={null} name="Daniela Reyes" email="daniela@northwind.co" />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('DR')).toBeInTheDocument();
  });

  it('renders single-letter initial for single-token name', () => {
    render(<Avatar url={null} name="Daniela" email="daniela@northwind.co" />);
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  // (3) url and name both missing, email present → email-derived initials
  it('falls back to email initials when name is missing', () => {
    render(
      <Avatar url={null} name={null} email="daniela.reyes@northwind.co" />,
    );
    expect(screen.getByText('DR')).toBeInTheDocument();
  });

  // (4) Everything missing → "U"
  it('renders "U" when url, name, and email are all missing', () => {
    render(<Avatar url={null} name={null} email={null} />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  // (5) onError → switches to initials fallback (covers stale Google avatar URL — US2)
  it('falls back to initials when the image fires onError', () => {
    render(
      <Avatar
        url="https://expired.googleusercontent.com/xyz"
        name="Daniela Reyes"
        email="daniela@northwind.co"
      />,
    );
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('DR')).toBeInTheDocument();
  });

  // Regression for PR review: errored state must reset when url prop changes
  // so a fresh provider URL gets a fresh chance to load.
  it('retries the image when url prop changes after a previous onError', () => {
    const { rerender } = render(
      <Avatar
        url="https://expired.googleusercontent.com/old"
        name="Daniela Reyes"
        email="daniela@northwind.co"
      />,
    );
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    rerender(
      <Avatar
        url="https://lh3.googleusercontent.com/new"
        name="Daniela Reyes"
        email="daniela@northwind.co"
      />,
    );
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toBe('https://lh3.googleusercontent.com/new');
  });

  it('respects custom size', () => {
    render(
      <Avatar url={null} name="Daniela Reyes" email="daniela@northwind.co" size={56} />,
    );
    const node = screen.getByText('DR').closest('div');
    expect(node).toHaveStyle({ width: '56px', height: '56px' });
  });
});
