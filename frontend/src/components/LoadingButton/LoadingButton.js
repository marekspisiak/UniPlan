import React from "react";
import { Button, Spinner } from "react-bootstrap";

const LoadingButton = ({ loading, disabled, children, ...props }) => {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-2"
          />
          Načítavam...
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton;
