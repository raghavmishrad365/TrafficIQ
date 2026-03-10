import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  multiAgentOrchestrator,
} from "../services/agents/MultiAgentOrchestrator";
import { setNavigateCallback, setPlannedJourneyCallback } from "../services/agents/tools/sharedTools";
import { useJourneyContext } from "./JourneyContext";
import type { ChatMessage, AgentStatusInfo, ChatPanelLayout, ChatLayoutMode } from "../types/chat";
import type { AgentDomain } from "../services/agents/agentRegistry";

const DEFAULT_LAYOUT: ChatPanelLayout = {
  mode: "docked-right",
  floatX: Math.max(0, (typeof window !== "undefined" ? window.innerWidth : 1200) - 440),
  floatY: 80,
  floatWidth: 420,
  floatHeight: 600,
  previousMode: "docked-right",
};

function loadLayout(): ChatPanelLayout {
  try {
    const stored = localStorage.getItem("chat-panel-layout");
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ChatPanelLayout>;
      return { ...DEFAULT_LAYOUT, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_LAYOUT };
}

function saveLayout(layout: ChatPanelLayout) {
  try {
    localStorage.setItem("chat-panel-layout", JSON.stringify(layout));
  } catch { /* ignore */ }
}

interface ChatContextValue {
  messages: ChatMessage[];
  isOpen: boolean;
  isProcessing: boolean;
  isInitialized: boolean;
  error: string | null;
  activeAgent: AgentDomain | null;
  agentStatuses: AgentStatusInfo[];
  panelLayout: ChatPanelLayout;
  setLayoutMode: (mode: ChatLayoutMode) => void;
  updateFloatPosition: (x: number, y: number) => void;
  updateFloatSize: (w: number, h: number) => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  newConversation: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentDomain | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatusInfo[]>([]);
  const [panelLayout, setPanelLayout] = useState<ChatPanelLayout>(loadLayout);
  const navigate = useNavigate();
  const { setPlannedJourney } = useJourneyContext();

  // Register navigation callback for the navigate_to_page tool
  useEffect(() => {
    setNavigateCallback((path: string) => {
      navigate(path);
    });
  }, [navigate]);

  // Register journey context callback so agent plan_journey results appear on the planner page
  useEffect(() => {
    setPlannedJourneyCallback((planned) => {
      setPlannedJourney(planned);
    });
  }, [setPlannedJourney]);

  // Set up callbacks for the multi-agent orchestrator
  useEffect(() => {
    multiAgentOrchestrator.setCallbacks(
      (updatedMessages) => {
        setMessages(updatedMessages);
        setActiveAgent(multiAgentOrchestrator.getActiveAgent());
      },
      (processing) => setIsProcessing(processing),
      (statuses) => setAgentStatuses(statuses)
    );
  }, []);

  const setLayoutMode = useCallback((mode: ChatLayoutMode) => {
    setPanelLayout((prev) => {
      const next: ChatPanelLayout = {
        ...prev,
        previousMode: prev.mode === "minimized" ? prev.previousMode : prev.mode,
        mode,
      };
      saveLayout(next);
      return next;
    });
  }, []);

  const updateFloatPosition = useCallback((x: number, y: number) => {
    setPanelLayout((prev) => {
      const next = { ...prev, floatX: x, floatY: y };
      saveLayout(next);
      return next;
    });
  }, []);

  const updateFloatSize = useCallback((w: number, h: number) => {
    setPanelLayout((prev) => {
      const next = { ...prev, floatWidth: w, floatHeight: h };
      saveLayout(next);
      return next;
    });
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Initialize on first message if not already done
      if (!isInitialized) {
        try {
          setError(null);
          await multiAgentOrchestrator.initialize();
          setIsInitialized(true);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Failed to initialize agent";
          setError(msg);
          return;
        }
      }

      setError(null);
      try {
        await multiAgentOrchestrator.sendMessage(content);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to send message";
        setError(msg);
      }
    },
    [isInitialized]
  );

  const newConversation = useCallback(async () => {
    try {
      setError(null);
      if (isInitialized) {
        await multiAgentOrchestrator.newConversation();
      }
      setMessages([]);
      setActiveAgent(null);
      setAgentStatuses([]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create new conversation";
      setError(msg);
    }
  }, [isInitialized]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isOpen,
        isProcessing,
        isInitialized,
        error,
        activeAgent,
        agentStatuses,
        panelLayout,
        setLayoutMode,
        updateFloatPosition,
        updateFloatSize,
        toggleChat,
        openChat,
        closeChat,
        sendMessage,
        newConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
