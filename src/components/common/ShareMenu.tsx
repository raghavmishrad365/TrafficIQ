import { useState } from "react";
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Share24Regular,
  Globe24Regular,
  Map24Regular,
  Navigation24Regular,
  Copy24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";
import type { ShareableRoute, ShareTarget } from "../../utils/shareLinks";
import { getShareUrl, copyRouteToClipboard } from "../../utils/shareLinks";

const useStyles = makeStyles({
  copied: {
    color: tokens.colorPaletteGreenForeground1,
  },
});

interface ShareMenuProps {
  route: ShareableRoute;
  size?: "small" | "medium" | "large";
  appearance?: "subtle" | "secondary" | "primary";
}

export function ShareMenu({ route, size = "small", appearance = "subtle" }: ShareMenuProps) {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);

  const handleShare = (target: ShareTarget) => {
    if (target === "clipboard") {
      copyRouteToClipboard(route).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      window.open(getShareUrl(target, route), "_blank", "noopener");
    }
  };

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content="Share route" relationship="label">
          <Button
            appearance={appearance}
            size={size}
            icon={<Share24Regular />}
            onClick={(e) => e.stopPropagation()}
          >
            Share
          </Button>
        </Tooltip>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem
            icon={<Globe24Regular />}
            onClick={() => handleShare("google")}
          >
            Open in Google Maps
          </MenuItem>
          <MenuItem
            icon={<Map24Regular />}
            onClick={() => handleShare("apple")}
          >
            Open in Apple Maps
          </MenuItem>
          <MenuItem
            icon={<Navigation24Regular />}
            onClick={() => handleShare("waze")}
          >
            Open in Waze
          </MenuItem>
          <MenuItem
            icon={copied ? <Checkmark24Regular className={styles.copied} /> : <Copy24Regular />}
            onClick={() => handleShare("clipboard")}
          >
            {copied ? "Copied!" : "Copy link"}
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}
