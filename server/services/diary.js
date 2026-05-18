async function writeToNotion(title, content, date, type) {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DB_ID;

  if (!apiKey || !dbId) {
    console.log("[日记] Notion 未配置");
    return null;
  }

  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Name: { title: [{ text: { content: title } }] },
          Date: {
            date: { start: date || new Date().toISOString().slice(0, 10) },
          },
          Type: { select: { name: type || "ai" } },
        },
        children: [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content } }],
            },
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.id) {
      console.log(`[日记] 已写入 Notion: ${title} (${type})`);
      return data;
    } else {
      console.error("[日记] Notion 写入失败:", data);
      return null;
    }
  } catch (e) {
    console.error("[日记] Notion 写入失败:", e.message);
    return null;
  }
}

async function readFromNotion(type, limit) {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DB_ID;

  if (!apiKey || !dbId) return [];

  try {
    const filter = type
      ? {
          property: "Type",
          select: { equals: type },
        }
      : undefined;

    const response = await fetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          filter,
          sorts: [{ property: "Date", direction: "descending" }],
          page_size: limit || 20,
        }),
      },
    );

    const data = await response.json();
    if (!data.results) return [];

    // 获取每条日记的内容
    const entries = [];
    for (const page of data.results) {
      const title = page.properties.Name?.title?.[0]?.text?.content || "";
      const date = page.properties.Date?.date?.start || "";
      const pageType = page.properties.Type?.select?.name || "";

      // 获取页面内容
      let content = "";
      try {
        const blockRes = await fetch(
          `https://api.notion.com/v1/blocks/${page.id}/children`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Notion-Version": "2022-06-28",
            },
          },
        );
        const blocks = await blockRes.json();
        if (blocks.results) {
          content = blocks.results
            .filter((b) => b.type === "paragraph")
            .map(
              (b) =>
                b.paragraph?.rich_text?.map((t) => t.text?.content).join("") ||
                "",
            )
            .join("\n");
        }
      } catch {}

      entries.push({ id: page.id, title, date, type: pageType, content });
    }

    return entries;
  } catch (e) {
    console.error("[日记] Notion 读取失败:", e.message);
    return [];
  }
}

async function updateNotionPage(pageId, content) {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return null;

  try {
    // 先删除旧内容块
    const blockRes = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
        },
      },
    );
    const blocks = await blockRes.json();
    if (blocks.results) {
      for (const block of blocks.results) {
        await fetch(`https://api.notion.com/v1/blocks/${block.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Notion-Version": "2022-06-28",
          },
        });
      }
    }

    // 写入新内容
    await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        children: [
          {
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: [{ text: { content } }] },
          },
        ],
      }),
    });

    return true;
  } catch (e) {
    console.error("[日记] Notion 更新失败:", e.message);
    return null;
  }
}

module.exports = { writeToNotion, readFromNotion, updateNotionPage };
