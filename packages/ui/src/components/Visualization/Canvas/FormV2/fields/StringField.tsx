import { TextInputGroup, TextInputGroupMain, TextInputGroupUtilities } from '@patternfly/react-core';
import { FunctionComponent, useContext } from 'react';
import { isDefined } from '../../../../../utils';
import { useFieldValue } from '../hooks/field-value';
import { SchemaContext } from '../providers/SchemaProvider';
import { FieldProps } from '../typings';
import { FieldWrapper } from './FieldWrapper';
import { FieldActions } from './FieldActions';

export const StringField: FunctionComponent<FieldProps> = ({ propName, required, onRemove: onRemoveProps }) => {
  const { schema } = useContext(SchemaContext);
  const { value = '', errors, onChange, isRaw, disabled } = useFieldValue<string>(propName);
  const lastPropName = propName.split('.').pop();
  const ariaLabel = isDefined(onRemoveProps) ? 'Remove' : `Clear ${lastPropName} field`;

  const onFieldChange = (_event: unknown, value: string) => {
    onChange(value);
  };

  const onRemove = () => {
    if (isDefined(onRemoveProps)) {
      onRemoveProps(propName);
      return;
    }

    /** Clear field by removing its value */
    onChange(undefined as unknown as string);
  };

  const id = `${propName}-popover`;

  return (
    <FieldWrapper
      propName={propName}
      required={required}
      title={schema.title}
      type="string"
      description={schema.description}
      defaultValue={schema.default?.toString()}
      errors={errors}
      isRaw={isRaw}
    >
      <TextInputGroup validated={errors ? 'error' : undefined} isDisabled={disabled}>
        <TextInputGroupMain
          type="text"
          role="textbox"
          className="pf-m-icon kaoto-form__string-field"
          id={propName}
          name={propName}
          placeholder={schema.default?.toString()}
          value={value}
          onChange={onFieldChange}
          aria-label={schema.title}
          aria-describedby={id}
        />

        <TextInputGroupUtilities>
          <FieldActions propName={propName} clearAriaLabel={ariaLabel} onRemove={onRemove} />
        </TextInputGroupUtilities>
      </TextInputGroup>
    </FieldWrapper>
  );
};
