import sys
import re

with open('src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'const handleBidSubmit = async[\s\S]*?amount\r?\n\s*\}\);\r?\n\s*\};')

replacement = """  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateSettings = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AuctionSettings.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  // Handlers
  const handleIncrementChange = async (incrementSize) => {
    if (!settings) {
       toast.error("Auction settings not found. Please initialize settings first.");
       return;
    }
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        data: { current_bid_increment: incrementSize }
      });
      await createLog.mutateAsync({
        type: "admin",
        message: "Admin updated Global Bid Increment to ₹" + incrementSize + "L",
      });
      toast.success("Global Bid Increment set to ₹" + incrementSize + "L");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update bid increment.");
    }
  };"""

if pattern.search(text):
    new_text = pattern.sub(replacement, text)
    with open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Successfully patched AdminDashboard.jsx")
else:
    print("Regex did not match")
