import { Form } from "react-bootstrap";

export const ValidatedControl = ({
  name,
  label,
  register,
  errors,
  ...props
}) => (
  <Form.Group className="mb-3">
    <Form.Label>{label}</Form.Label>
    <Form.Control isInvalid={!!errors[name]} {...register(name)} {...props} />
    <FormError errors={errors} name={name} />
  </Form.Group>
);
export const ValidateCheck = ({ name, label, register, errors, ...props }) => (
  <Form.Group className="mb-3">
    <Form.Check
      label={label}
      isInvalid={!!errors[name]}
      {...register(name)}
      {...props}
    />
    <FormError errors={errors} name={name} />
  </Form.Group>
);

export const FormError = ({ errors, name }) => {
  return (
    errors[name] && (
      <Form.Text className="text-danger">{errors[name].message}</Form.Text>
    )
  );
};
