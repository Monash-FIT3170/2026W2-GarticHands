import { useState, useCallback, useEffect } from 'react';

type ToastVariant = 'pill' | 'default';

interface ToastProps {
  message: string;
  visible: boolean;
  variant?: ToastVariant;
}

const variantClasses: Record<ToastVariant, string> = {
  /** Rounded pill anchored to the bottom — hostingPage. */
  pill: 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2F4542] text-white px-5 py-3 rounded-full shadow-lg font-semibold',
  /** Squared default — joinedPage. */
  default:
    'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-4 py-2 rounded',
};

/**
 * Ephemeral feedback at the bottom of the page.
 *
 * Returns `null` when not visible so it doesn't reserve layout space.
 * Prefer the `useToast()` hook below for state management.
 */
export default function Toast({ message, visible, variant = 'pill' }: ToastProps) {
  if (!visible) return null;
  return <div className={variantClasses[variant]}>{message}</div>;
}

/**
 * Hook returning `{ toast, show }` — `toast` is the rendered element, `show(msg)`
 * displays it for `durationMs` (default 2000ms).
 */
export function useToast(variant: ToastVariant = 'pill', durationMs = 2000) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(t);
  }, [visible, durationMs]);

  const toast = <Toast message={message} visible={visible} variant={variant} />;
  return { toast, show };
}
