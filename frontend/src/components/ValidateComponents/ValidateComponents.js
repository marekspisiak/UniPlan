import { Form } from "react-bootstrap";

export const ValidatedField = ({
  name,
  label,
  type = "text",
  register,
  errors,
  clean = false,
  controllClassName,
  ...props
}) => {
  const isInvalid = !!errors[name];
  const error = <FormError errors={errors} name={name} />;

  // Special case: checkbox / radio
  if (type === "checkbox" || type === "radio") {
    const fieldId = props.id || `field-${name}`;

    return (
      <Form.Group className={clean ? "" : "mb-3"}>
        <Form.Check
          id={fieldId}
          type={type}
          label={label}
          isInvalid={isInvalid}
          {...register(name)}
          {...props}
        />
        {error}
      </Form.Group>
    );
  }

  // Inlined control without label/group
  const control = (
    <>
      <Form.Control
        type={type}
        isInvalid={isInvalid}
        className={controllClassName}
        {...register(name)}
        {...props}
      />
      {error}
    </>
  );

  // Wrap in Form.Group only if label exists
  return label ? (
    <Form.Group className={clean ? "" : "mb-3"}>
      <Form.Label>{label}</Form.Label>
      {control}
    </Form.Group>
  ) : (
    control
  );
};

export const FormError = ({ errors, name }) => {
  return (
    errors[name] && (
      <Form.Text className="text-danger">{errors[name].message}</Form.Text>
    )
  );
};
