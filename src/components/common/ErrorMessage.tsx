import React from "react";
import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
  Button,
} from "@fluentui/react-components";

export interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = "Error",
  message,
  onRetry,
}) => {
  return (
    <MessageBar intent="error">
      <MessageBarBody>
        <MessageBarTitle>{title}</MessageBarTitle>
        {message}
      </MessageBarBody>
      {onRetry && (
        <MessageBarActions>
          <Button appearance="transparent" onClick={onRetry}>
            Retry
          </Button>
        </MessageBarActions>
      )}
    </MessageBar>
  );
};

export default ErrorMessage;
