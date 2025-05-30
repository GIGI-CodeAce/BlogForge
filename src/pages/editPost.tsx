import { useEffect, useState } from "react";
import RichTextEditor from "@mantine/rte";
import { Navigate, useParams } from "react-router-dom";
import type { PostProps } from "../Post";
import { API_BASE } from "../components/api";
import { addTag,HandleErrors,removeTag } from '../components/postTools';

function EditPost() {
  const [content, setContent] = useState('<span >Your content here</span>');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [redirect, setRedirect] = useState(false);
  const [errorWarning, setErrorWarning] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/post/${id}`)
      .then((res) => {
        if (!res.ok) {
          setErrorWarning(true);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: PostProps) => {
        const { title, content, summary, tags } = data;
        setTitle(title);
        setContent(content);
        setSummary(summary);
        setTagList(tags || []);
      })
      .catch((err) => {
        console.error("Failed to fetch post:", err);
      });
  }, [id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag({tagInput, tagList, setTagList, setTagInput})
    }
  };

  async function updatePost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (title.length < 3 || title.length > 35) {
      setErrorWarning(true);
      return;
    }

    const data = new FormData();
    data.set('title', title);
    data.set('summary', summary);
    data.set('content', content);
    if (id !== undefined) {
      data.set('id', id);
    }
    data.set('tags', JSON.stringify(tagList));
    if (files && files[0]) {
      data.set('file', files[0]);
    }

    try {
      const response = await fetch(`${API_BASE}/post`, {
        method: 'PUT',
        body: data,
        credentials: 'include'
      });

      if (!response.ok) {
        setErrorWarning(true);
        throw new Error('Failed to update post');
      }

      setRedirect(true);
    } catch (err) {
      console.error('Error updating post:', err);
    }
  }

  if (redirect) {
    return <Navigate to={`/post/${id}`} />;
  }

  return (
    <main className='mt-5 px-3'>
      <h1 className="text-center text-3xl font-extrabold">Edit post</h1>
      <HandleErrors title={title} errorWarning={errorWarning} />
      <form
        onSubmit={updatePost}
        className="flex flex-col gap-4 mt-10 w-full max-w-xl mx-auto"
      >
        <input
          value={title}
          maxLength={35}
          onChange={e => {
            setTitle(e.target.value);
            if (errorWarning) setErrorWarning(false);
          }}
          className="border border-gray-500 p-2"
          type="text"
          placeholder="Post title (max 35 chars)"
        />
        <input
          value={summary}
          onChange={e => setSummary(e.target.value)}
          className="border border-gray-500 p-2"
          type="text"
          placeholder="Post summary"
        />
        {files?.[0] && (
          <p className="text-sm text-gray-600">Selected: {files[0].name}</p>
        )}
        <input
          className="border rounded p-2"
          type="file"
          onChange={e => setFiles(e.target.files)}
        />
        <RichTextEditor
          controls={[
            ['bold', 'italic', 'underline', 'strike'],
            ['h1', 'h2', 'h3'],
            ['unorderedList', 'orderedList'],
            ['link', 'video'],
            ['code', 'blockquote'],
            ['alignLeft', 'alignCenter', 'alignRight'],
          ]}
          value={content}
          onChange={setContent}
        />

        {/* --- Tag Input --- */}
        <div>
          <div className="flex gap-2 relative">
            <span className="text-3xl select-none absolute left-[6px] top-[3px]">#</span>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border border-gray-500 p-2 flex-1 pl-7"
              type="text"
              placeholder="Add a tag (min 2, max 15 chars)"
            />
            <button
              type="button"
              onClick={()=>addTag({tagInput, tagList, setTagList, setTagInput})}
              className="bg-black hover:bg-gray-800 text-white px-3 rounded"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tagList.map(tag => (
              <span
                key={tag}
                className="bg-gray-200 text-sm px-3 py-1 rounded-full flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag({ tag, tagList, setTagList })}
                  className="text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="text-white px-4 py-2 rounded bg-black hover:bg-gray-800"
        >
          Update post
        </button>
      </form>
      <br />
    </main>
  );
}

export default EditPost;
