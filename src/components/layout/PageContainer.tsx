import { makeStyles, tokens, shorthands, mergeClasses } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    flex: 1,
    overflowY: "auto",
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    backgroundColor: tokens.colorNeutralBackground2,
    scrollBehavior: "smooth" as const,
    animationName: {
      from: { opacity: 0, transform: "translateY(4px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    },
    animationDuration: "200ms",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
  },
  noPadding: {
    ...shorthands.padding("0"),
  },
});

interface PageContainerProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function PageContainer({ children, noPadding }: PageContainerProps) {
  const styles = useStyles();
  return (
    <main
      className={mergeClasses(
        styles.container,
        noPadding ? styles.noPadding : undefined
      )}
    >
      {children}
    </main>
  );
}
