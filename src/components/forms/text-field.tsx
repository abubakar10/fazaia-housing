"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FieldShellProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  className?: string;
  /** Show eye toggle for password fields (default true when type is password). */
  revealPassword?: boolean;
};

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  required,
  hint,
  disabled,
  className,
  revealPassword,
}: TextFieldProps<T>) {
  const id = String(name);
  const isPassword = type === "password";
  const canReveal = isPassword && (revealPassword ?? true);
  const [visible, setVisible] = React.useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          htmlFor={id}
          required={required}
          hint={hint}
          error={fieldState.error?.message}
          className={className}
        >
          <div className="relative">
            <Input
              {...field}
              id={id}
              type={canReveal ? (visible ? "text" : "password") : type}
              placeholder={placeholder}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
              className={cn("min-h-11", canReveal && "pr-11")}
              value={field.value ?? ""}
              autoComplete={isPassword ? "current-password" : undefined}
            />
            {canReveal ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="absolute top-1/2 right-1 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
              >
                {visible ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            ) : null}
          </div>
        </FieldShell>
      )}
    />
  );
}

type TextareaFieldProps<T extends FieldValues> = Omit<
  TextFieldProps<T>,
  "type" | "revealPassword"
> & {
  rows?: number;
};

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  hint,
  disabled,
  className,
  rows = 4,
}: TextareaFieldProps<T>) {
  const id = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          htmlFor={id}
          required={required}
          hint={hint}
          error={fieldState.error?.message}
          className={className}
        >
          <Textarea
            {...field}
            id={id}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!fieldState.error}
            value={field.value ?? ""}
          />
        </FieldShell>
      )}
    />
  );
}
