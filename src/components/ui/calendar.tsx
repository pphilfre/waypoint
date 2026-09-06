import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: ButtonProps["variant"];
}) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn("wp-calendar", className)}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("wp-calendar-root", defaults.root),
        months: cn("wp-calendar-months", defaults.months),
        month: cn("wp-calendar-month", defaults.month),
        nav: cn("wp-calendar-nav", defaults.nav),
        button_previous: cn("wp-calendar-nav-button", defaults.button_previous),
        button_next: cn("wp-calendar-nav-button", defaults.button_next),
        month_caption: cn("wp-calendar-caption", defaults.month_caption),
        caption_label: cn("wp-calendar-caption-label", defaults.caption_label),
        dropdowns: cn("wp-calendar-dropdowns", defaults.dropdowns),
        dropdown_root: cn("wp-calendar-dropdown-root", defaults.dropdown_root),
        dropdown: cn("wp-calendar-dropdown", defaults.dropdown),
        month_grid: cn("wp-calendar-grid", defaults.month_grid),
        weekdays: cn("wp-calendar-weekdays", defaults.weekdays),
        weekday: cn("wp-calendar-weekday", defaults.weekday),
        week: cn("wp-calendar-week", defaults.week),
        day: cn("wp-calendar-day", defaults.day),
        today: cn("is-today", defaults.today),
        outside: cn("is-outside", defaults.outside),
        selected: cn("is-selected", defaults.selected),
        disabled: cn("is-disabled", defaults.disabled),
        hidden: cn("is-hidden", defaults.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
        ),
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === "left") return <ChevronLeft className={chevronClassName} {...chevronProps} />;
          if (orientation === "right") return <ChevronRight className={chevronClassName} {...chevronProps} />;
          return <ChevronDown className={chevronClassName} {...chevronProps} />;
        },
        PreviousMonthButton: ({ className: previousClassName, ...buttonProps }) => (
          <Button variant={buttonVariant} size="icon" className={cn("wp-calendar-nav-control", previousClassName)} {...buttonProps} />
        ),
        NextMonthButton: ({ className: nextClassName, ...buttonProps }) => (
          <Button variant={buttonVariant} size="icon" className={cn("wp-calendar-nav-control", nextClassName)} {...buttonProps} />
        ),
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected={modifiers.selected || undefined}
      data-today={modifiers.today || undefined}
      className={cn("wp-calendar-day-button", className)}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
