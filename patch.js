const fs = require('fs');
let f = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

const regex = /const handleBidSubmit = async[\s\S]*?amount\r?\n\s*\}\);\r?\n\s*\};/;

const replaceContent = `/** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
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
  };`;

if (regex.test(f)) {
    f = f.replace(regex, replaceContent);
    fs.writeFileSync('src/pages/AdminDashboard.jsx', f);
    console.log('Successfully patched AdminDashboard!');
} else {
    console.log('Regex did not match handleBidSubmit block.');
}
