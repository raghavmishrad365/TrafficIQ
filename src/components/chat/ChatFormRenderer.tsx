import { useState, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Input,
  Button,
  Field,
  Radio,
  RadioGroup,
  shorthands,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    ...shorthands.padding("0", "0", tokens.spacingVerticalXS, "0"),
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalXS,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  choiceItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  factSet: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusMedium,
  },
  factRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
  },
  factTitle: {
    fontWeight: tokens.fontWeightSemibold,
    minWidth: "90px",
    color: tokens.colorNeutralForeground3,
  },
  factValue: {
    color: tokens.colorNeutralForeground1,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalS, "0", "0", "0"),
  },
  actionPrimary: {
    flexGrow: 1,
  },
  submitted: {
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: "center" as const,
  },
});

interface CardElement {
  type: string;
  id?: string;
  text?: string;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  value?: string;
  choices?: Array<{ title: string; value: string }>;
  weight?: string;
  size?: string;
  wrap?: boolean;
  spacing?: string;
  facts?: Array<{ title: string; value: string }>;
  [key: string]: unknown;
}

interface CardAction {
  type: string;
  title: string;
  style?: string;
  data?: Record<string, unknown>;
  url?: string;
}

export interface CardPayload {
  type: string;
  version?: string;
  body?: CardElement[];
  actions?: CardAction[];
  [key: string]: unknown;
}

interface ChatFormRendererProps {
  card: CardPayload;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function ChatFormRenderer({ card, onSubmit }: ChatFormRendererProps) {
  const styles = useStyles();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Initialize default values from card body
  useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const el of card.body || []) {
      if (el.id && el.value) {
        defaults[el.id] = el.value;
      }
    }
    setFormValues(defaults);
  }, [card]);

  const handleChange = (id: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (actionData?: Record<string, unknown>) => {
    setSubmitted(true);
    onSubmit({ ...formValues, ...(actionData || {}) });
  };

  if (submitted) {
    return (
      <div className={styles.submitted}>
        <Text size={300} italic>
          Form submitted
        </Text>
      </div>
    );
  }

  // Check if the form has input fields (is a form) or just actions (is a prompt)
  const hasInputFields = (card.body || []).some(
    (el) => el.type === "Input.Text" || el.type === "Input.ChoiceSet" || el.type === "Input.Toggle"
  );

  // Separate header TextBlocks from input fields
  const headerElements: CardElement[] = [];
  const bodyElements: CardElement[] = [];
  let inHeader = true;
  for (const el of card.body || []) {
    if (inHeader && el.type === "TextBlock") {
      headerElements.push(el);
    } else {
      inHeader = false;
      bodyElements.push(el);
    }
  }

  return (
    <div className={styles.form}>
      {/* Header section */}
      {headerElements.length > 0 && (
        <div className={hasInputFields ? styles.header : undefined}>
          {headerElements.map((element, i) => {
            const isBolder = element.weight === "bolder" || element.weight === "Bolder";
            const sizeMap: Record<string, 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000> = {
              small: 200,
              default: 300,
              medium: 400,
              large: 500,
              extraLarge: 600,
            };
            const textSize = sizeMap[element.size || "default"] || 300;
            return (
              <Text
                key={`h-${i}`}
                size={textSize}
                weight={isBolder ? "bold" : "regular"}
                block
                className={!isBolder ? styles.subtitle : undefined}
              >
                {element.text}
              </Text>
            );
          })}
        </div>
      )}

      {/* Body section */}
      <div className={styles.fieldGroup}>
        {bodyElements.map((element, i) => {
          switch (element.type) {
            case "TextBlock": {
              const isBolder = element.weight === "bolder" || element.weight === "Bolder";
              return (
                <Text
                  key={i}
                  size={isBolder ? 400 : 300}
                  weight={isBolder ? "bold" : "regular"}
                  block
                  className={!isBolder ? styles.subtitle : undefined}
                >
                  {element.text}
                </Text>
              );
            }

            case "Input.Text":
              return (
                <Field key={i} label={element.label} required={element.isRequired}>
                  <Input
                    placeholder={element.placeholder}
                    value={formValues[element.id || ""] ?? ""}
                    onChange={(_, data) => handleChange(element.id || "", data.value)}
                    appearance="filled-darker"
                  />
                </Field>
              );

            case "Input.ChoiceSet":
              return (
                <Field key={i} label={element.label}>
                  <RadioGroup
                    value={formValues[element.id || ""] || element.value || ""}
                    onChange={(_, data) => handleChange(element.id || "", data.value)}
                  >
                    {(element.choices || []).map((choice) => (
                      <Radio
                        key={choice.value}
                        value={choice.value}
                        label={choice.title}
                      />
                    ))}
                  </RadioGroup>
                </Field>
              );

            case "Input.Toggle":
              return (
                <Field key={i} label={element.label}>
                  <RadioGroup
                    value={formValues[element.id || ""] || "false"}
                    onChange={(_, data) => handleChange(element.id || "", data.value)}
                  >
                    <Radio value="true" label="Yes" />
                    <Radio value="false" label="No" />
                  </RadioGroup>
                </Field>
              );

            case "FactSet":
              return (
                <div key={i} className={styles.factSet}>
                  {(element.facts || []).map((fact, fi) => (
                    <div key={fi} className={styles.factRow}>
                      <Text size={300} className={styles.factTitle}>
                        {fact.title}
                      </Text>
                      <Text size={300} className={styles.factValue}>
                        {fact.value}
                      </Text>
                    </div>
                  ))}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {(card.actions || []).map((action, i) => {
          if (action.type === "Action.OpenUrl" && action.url) {
            return (
              <Button
                key={i}
                appearance="secondary"
                onClick={() => window.open(action.url, "_blank", "noopener,noreferrer")}
              >
                {action.title}
              </Button>
            );
          }
          const isPrimary = action.style === "positive";
          return (
            <Button
              key={i}
              appearance={isPrimary ? "primary" : "secondary"}
              className={isPrimary ? styles.actionPrimary : undefined}
              onClick={() => handleSubmit(action.data)}
            >
              {action.title}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
