import customAnalysisData from '@/data/customAnalysis.json';

const parsePrompt = (prompt) => {
  const langMatch = prompt.match(/following\s+(\w+)\s+code/i);
  const language = langMatch?.[1]?.toLowerCase() ?? 'javascript';

  const codeMatch = prompt.match(/CODE:\n([\s\S]*?)\n\nYour task:/);
  const code = codeMatch ? codeMatch[1].trim() : '';

  // Match the last function call in the code (e.g., factorial(5))
  const callMatches = code.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)/g);
  const inputCall = callMatches ? callMatches[callMatches.length - 1].trim() : null;

  return { language, code, inputCall };
};

const findCustomResponse = ({ language, inputCall }) => {
  if (!inputCall) return null;
  return customAnalysisData.find((entry) =>
    entry.language === language && entry.inputCall === inputCall
  )?.response ?? null;
};

// A minimal mock of the Base44 client that reads from local data files.
export const base44 = {
  auth: {
    me: async () => ({ id: 'local-user', name: 'Local User', email: 'local@localhost' }),
    logout: () => {},
    redirectToLogin: () => {},
  },
  appLogs: {
    logUserInApp: async () => {},
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        const { language, inputCall } = parsePrompt(prompt);
        const response = findCustomResponse({ language, inputCall });
        if (!response) {
          throw new Error(
            `No local analysis found for language=${language} inputCall=${inputCall}. ` +
            `Add an entry to src/data/customAnalysis.json for this case.`
          );
        }
        return response;
      }
    }
  }
};
