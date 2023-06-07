import "./styles.css";
import styled from "styled-components";

export const Box = styled.div`
  ${({ pt }) => pt && `padding-top: ${pt}`}
`;

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  ${({ gap }) => gap && `gap: ${gap}`}
`;

export const Label = styled.label`
  display: block;
  font-weight: 600;
`;

export const LabelRadio = styled.label`
  display: block;
  input {
    margin-right: 4px;
  }
`;

export const RadioOptions = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Fieldset = styled.fieldset`
  border: 0;
  padding: 0;
`;

export const InputText = styled.input`
  display: block;
  min-height: 30px;
  border: 1px solid gray;
  border-radius: 4px;
  margin: 4px 0;
`;

export const Hint = styled.span`
  font-size: 14px;
  color: #333;
`;

export const ErrorMessage = styled.span`
  color: red;
  font-size: 13px;
`;
