import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";

import { joinClassNames, type StickerTone } from "../shared-types.js";

interface StickerBadgeSharedProps {
  children: ReactNode;
  leading?: ReactNode;
  tone?: StickerTone;
  shape?: "label" | "stamp" | "pill";
  size?: "compact" | "default" | "large";
  rotation?: number;
}

type StaticStickerBadgeProps = StickerBadgeSharedProps &
  HTMLAttributes<HTMLSpanElement> & {
    mode?: "static";
  };

type SelectStickerBadgeProps = StickerBadgeSharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
    mode: "select";
    selected: boolean;
    onSelectedChange: (selected: boolean) => void;
  };

type RemoveStickerBadgeProps = StickerBadgeSharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    mode: "remove";
    removeLabel: string;
    onRemove: () => void;
  };

export type StickerBadgeProps =
  StaticStickerBadgeProps | SelectStickerBadgeProps | RemoveStickerBadgeProps;

function BadgeContent({
  children,
  leading,
  mode,
  selected,
}: Pick<StickerBadgeSharedProps, "children" | "leading"> & {
  mode: "static" | "select" | "remove";
  selected: boolean;
}) {
  return (
    <>
      {leading ? (
        <span className="sui-sticker-badge-leading">{leading}</span>
      ) : null}
      {mode === "select" ? (
        <span aria-hidden="true" className="sui-sticker-badge-selection-mark">
          {selected ? "✓" : ""}
        </span>
      ) : null}
      <span className="sui-sticker-badge-label">{children}</span>
      {mode === "remove" ? (
        <span aria-hidden="true" className="sui-sticker-badge-remove-mark">
          ×
        </span>
      ) : null}
    </>
  );
}

export function StickerBadge(props: StickerBadgeProps) {
  const {
    children,
    className,
    leading,
    mode = "static",
    rotation = 0,
    shape = "label",
    size = "default",
    style,
    tone = "paper",
    ...elementProps
  } = props;
  const sharedProps = {
    className: joinClassNames(
      "sui-sticker-badge",
      mode !== "static" && "sui-focusable sui-motion",
      className,
    ),
    "data-mode": mode,
    "data-shape": shape,
    "data-size": size,
    "data-tone": tone,
    style: {
      ...style,
      "--sui-sticker-badge-rotation": `${String(rotation)}deg`,
    },
  };

  if (mode === "select") {
    const {
      onClick,
      onSelectedChange,
      selected,
      type = "button",
      ...buttonProps
    } = elementProps as Omit<
      SelectStickerBadgeProps,
      keyof StickerBadgeSharedProps
    >;
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) onSelectedChange(!selected);
    };

    return (
      <button
        {...buttonProps}
        {...sharedProps}
        aria-pressed={selected}
        data-selected={selected}
        onClick={handleClick}
        type={type}
      >
        <BadgeContent leading={leading} mode={mode} selected={selected}>
          {children}
        </BadgeContent>
      </button>
    );
  }

  if (mode === "remove") {
    const {
      onClick,
      onRemove,
      removeLabel,
      type = "button",
      ...buttonProps
    } = elementProps as Omit<
      RemoveStickerBadgeProps,
      keyof StickerBadgeSharedProps
    >;
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) onRemove();
    };

    return (
      <button
        {...buttonProps}
        {...sharedProps}
        aria-label={removeLabel}
        onClick={handleClick}
        type={type}
      >
        <BadgeContent leading={leading} mode={mode} selected={false}>
          {children}
        </BadgeContent>
      </button>
    );
  }

  return (
    <span {...elementProps} {...sharedProps}>
      <BadgeContent leading={leading} mode="static" selected={false}>
        {children}
      </BadgeContent>
    </span>
  );
}
