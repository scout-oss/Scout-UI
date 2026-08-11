import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import {
  joinClassNames,
  type ScoutMotionPolicy,
  type StickerTone,
} from "../shared-types.js";

interface StickerButtonSharedProps extends ScoutMotionPolicy {
  children: ReactNode;
  tone?: StickerTone;
  size?: "compact" | "default" | "large";
  shape?: "label" | "paper" | "pill";
  leading?: ReactNode;
  trailing?: ReactNode;
  fullWidth?: boolean;
}

type StickerButtonButtonProps = StickerButtonSharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
    loading?: boolean;
    loadingLabel?: string;
  };

type StickerButtonAnchorProps = StickerButtonSharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    loading?: never;
    loadingLabel?: never;
  };

export type StickerButtonProps =
  StickerButtonButtonProps | StickerButtonAnchorProps;

function ButtonContent({
  children,
  leading,
  trailing,
}: Pick<StickerButtonSharedProps, "children" | "leading" | "trailing">) {
  return (
    <span className="sui-sticker-button-content">
      {leading ? (
        <span className="sui-sticker-button-leading">{leading}</span>
      ) : null}
      <span className="sui-sticker-button-label">{children}</span>
      {trailing ? (
        <span className="sui-sticker-button-trailing">{trailing}</span>
      ) : null}
    </span>
  );
}

export function StickerButton(props: StickerButtonProps) {
  const {
    children,
    className,
    fullWidth = false,
    leading,
    reducedMotion = "system",
    shape = "paper",
    size = "default",
    tone = "ink",
    trailing,
    ...elementProps
  } = props;
  const sharedProps = {
    className: joinClassNames(
      "sui-sticker-button",
      "sui-focusable",
      "sui-motion",
      fullWidth && "sui-sticker-button-full-width",
      className,
    ),
    "data-reduced-motion": reducedMotion,
    "data-shape": shape,
    "data-size": size,
    "data-tone": tone,
  };

  if ("href" in props && typeof props.href === "string") {
    const anchorProps = elementProps as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a {...anchorProps} {...sharedProps} href={props.href}>
        <ButtonContent leading={leading} trailing={trailing}>
          {children}
        </ButtonContent>
      </a>
    );
  }

  const {
    disabled = false,
    loading = false,
    loadingLabel = "Loading…",
    type = "button",
    ...buttonProps
  } = elementProps as Omit<
    StickerButtonButtonProps,
    keyof StickerButtonSharedProps
  >;

  return (
    <button
      {...buttonProps}
      {...sharedProps}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      type={type}
    >
      <ButtonContent leading={leading} trailing={trailing}>
        {children}
      </ButtonContent>
      {loading ? (
        <span aria-live="polite" className="sui-sticker-button-loading">
          <span
            aria-hidden="true"
            className="sui-sticker-button-loading-mark"
          />
          {loadingLabel}
        </span>
      ) : null}
    </button>
  );
}
