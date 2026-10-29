import fs from 'fs';
import path from 'path';

const token = process.env.GH_TOKEN;
if (!token) {
  console.error('Missing GH_TOKEN environment variable.');
  process.exit(1);
}

const REPO_NAME = 'fluentflow';
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'FluentFlow-Deployer',
};

async function ghFetch(endpoint, options = {}) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

function walkDir(dir, baseDir = dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git' ||
        entry.name === '.github'
      ) {
        continue;
      }
      results = results.concat(walkDir(fullPath, baseDir));
    } else {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

async function pushFilesToBranch(owner, repo, branch, filesList, commitMessage) {
  // Get default branch ref to base off if needed
  const mainRef = await ghFetch(`/repos/${owner}/${repo}/git/ref/heads/main`);
  if (!mainRef.ok) {
    throw new Error(`Could not get main branch ref: ${JSON.stringify(mainRef.data)}`);
  }
  const baseSha = mainRef.data.object.sha;

  // Create blobs for all files
  const treeItems = [];
  for (const file of filesList) {
    const contentBase64 = fs.readFileSync(file.fullPath).toString('base64');
    const blobRes = await ghFetch(`/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: contentBase64,
        encoding: 'base64',
      }),
    });
    if (!blobRes.ok) {
      throw new Error(`Failed creating blob for ${file.relPath}: ${JSON.stringify(blobRes.data)}`);
    }
    treeItems.push({
      path: file.relPath,
      mode: '100644',
      type: 'blob',
      sha: blobRes.data.sha,
    });
  }

  // Create tree
  const treeRes = await ghFetch(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      tree: treeItems,
    }),
  });
  if (!treeRes.ok) {
    throw new Error(`Failed creating tree: ${JSON.stringify(treeRes.data)}`);
  }

  // Create commit
  const commitRes = await ghFetch(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: commitMessage,
      tree: treeRes.data.sha,
      parents: [baseSha],
    }),
  });
  if (!commitRes.ok) {
    throw new Error(`Failed creating commit: ${JSON.stringify(commitRes.data)}`);
  }

  // Check if branch exists
  const branchRef = await ghFetch(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  if (branchRef.ok) {
    await ghFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: commitRes.data.sha,
        force: true,
      }),
    });
  } else {
    await ghFetch(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: commitRes.data.sha,
      }),
    });
  }
}

async function main() {
  // 1. Get authenticated user
  const userRes = await ghFetch('/user');
  if (!userRes.ok) {
    throw new Error(`Failed to get GitHub user: ${JSON.stringify(userRes.data)}`);
  }
  const owner = userRes.data.login;
  console.log(`Authenticated as GitHub user: ${owner}`);

  // 2. Check or create repository
  let repoRes = await ghFetch(`/repos/${owner}/${REPO_NAME}`);
  if (!repoRes.ok) {
    console.log(`Creating public repository ${owner}/${REPO_NAME}...`);
    repoRes = await ghFetch('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name: REPO_NAME,
        description: 'FluentFlow — App para aprender inglês com Leitura Interativa, Flashcards SM-2 e Roleplay IA',
        private: false,
        auto_init: true,
      }),
    });
    if (!repoRes.ok) {
      throw new Error(`Failed creating repository: ${JSON.stringify(repoRes.data)}`);
    }
    // Wait briefly for initial commit on GitHub
    await new Promise((r) => setTimeout(r, 2500));
  } else {
    console.log(`Repository ${owner}/${REPO_NAME} already exists.`);
  }

  // 3. Push source files to main branch
  const rootDir = process.cwd();
  const sourceFiles = walkDir(rootDir, rootDir);
  console.log(`Uploading ${sourceFiles.length} source files to 'main' branch...`);
  await pushFilesToBranch(
    owner,
    REPO_NAME,
    'main',
    sourceFiles,
    'feat: FluentFlow English PWA complete source code'
  );

  // 4. Push built dist/ files to gh-pages branch (including .nojekyll)
  const distDir = path.join(rootDir, 'dist');
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  const distFiles = walkDir(distDir, distDir);
  console.log(`Uploading ${distFiles.length} production files to 'gh-pages' branch...`);
  await pushFilesToBranch(
    owner,
    REPO_NAME,
    'gh-pages',
    distFiles,
    'deploy: FluentFlow PWA production build'
  );

  // 5. Enable GitHub Pages on gh-pages branch
  console.log('Configuring GitHub Pages...');
  const pagesCheck = await ghFetch(`/repos/${owner}/${REPO_NAME}/pages`);
  if (!pagesCheck.ok) {
    const pagesCreate = await ghFetch(`/repos/${owner}/${REPO_NAME}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        source: {
          branch: 'gh-pages',
          path: '/',
        },
      }),
    });
    if (!pagesCreate.ok && pagesCreate.status !== 409) {
      console.warn('Note when enabling Pages:', pagesCreate.data);
    }
  } else {
    await ghFetch(`/repos/${owner}/${REPO_NAME}/pages`, {
      method: 'PUT',
      body: JSON.stringify({
        source: {
          branch: 'gh-pages',
          path: '/',
        },
      }),
    });
  }

  const liveUrl = `https://${owner.toLowerCase()}.github.io/${REPO_NAME}/`;
  console.log(`\n✅ SUCCESS! Repository: https://github.com/${owner}/${REPO_NAME}`);
  console.log(`🌐 Live GitHub Pages URL: ${liveUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
