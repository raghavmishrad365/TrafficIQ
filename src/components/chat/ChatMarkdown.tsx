import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    "& p": {
      marginTop: "0",
      marginBottom: tokens.spacingVerticalS,
    },
    "& p:last-child": {
      marginBottom: "0",
    },
    "& strong": {
      fontWeight: tokens.fontWeightSemibold,
    },
    "& a": {
      color: tokens.colorBrandForeground1,
      textDecoration: "none",
    },
    "& a:hover": {
      textDecoration: "underline",
    },
    "& ul, & ol": {
      marginTop: "0",
      marginBottom: tokens.spacingVerticalS,
      paddingLeft: tokens.spacingHorizontalXL,
    },
    "& li": {
      marginBottom: tokens.spacingVerticalXXS,
    },
    "& h1, & h2, & h3": {
      marginTop: tokens.spacingVerticalS,
      marginBottom: tokens.spacingVerticalXS,
      fontWeight: tokens.fontWeightSemibold,
    },
    "& h1": { fontSize: tokens.fontSizeBase600 },
    "& h2": { fontSize: tokens.fontSizeBase500 },
    "& h3": { fontSize: tokens.fontSizeBase400 },
  },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: tokens.fontSizeBase300,
    backgroundColor: tokens.colorNeutralBackground4,
    padding: `1px ${tokens.spacingHorizontalXXS}`,
    borderRadius: tokens.borderRadiusSmall,
  },
  codeBlock: {
    fontFamily: "monospace",
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    backgroundColor: tokens.colorNeutralBackground6,
    color: tokens.colorNeutralForeground1,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    overflowX: "auto",
    marginTop: "0",
    marginBottom: tokens.spacingVerticalS,
    whiteSpace: "pre",
  },
});

const components: (styles: ReturnType<typeof useStyles>) => Components = (styles) => ({
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <pre className={styles.codeBlock}>
          <code>{children}</code>
        </pre>
      );
    }
    return <code className={styles.inlineCode}>{children}</code>;
  },
  pre: ({ children }) => <>{children}</>,
});

interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  const styles = useStyles();
  const comps = components(styles);

  return (
    <div className={styles.root}>
      <ReactMarkdown components={comps}>{content}</ReactMarkdown>
    </div>
  );
}
