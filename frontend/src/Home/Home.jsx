import axios from 'axios';
import {React, useState,useEffect, use} from 'react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { FaRegCommentDots } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { Link } from 'react-router-dom';

const Home = () => {
  const [formData, setFormData] = useState([]);
  const [error, setError] = useState('');
  const [id, setId] = useState('');
  const [commentInput, setCommentInput] = useState({});
  const [replyInput, setReplyInput] = useState({});
const [showReplyBox, setShowReplyBox] = useState({});
const [showReplies, setShowReplies] = useState({});
const [user , setUser] = useState([]);
const [commentBox, setCommentBox] = useState({});
const [openMenu, setOpenMenu] = useState(false);
const toggleMenu = (commentId) => {
  setOpenMenu((prev) => ({
    ...prev,
    [commentId]: !prev[commentId],
  }));
};

    const [currentImageIndex, setCurrentImageIndex] = useState({});
const nextImage = (postId, images) => {
  setCurrentImageIndex((prev) => ({
    ...prev,
    [postId]: (prev[postId] + 1) % images.length,
  }));
};

const prevImage = (postId, images) => {
  setCurrentImageIndex((prev) => ({
    ...prev,
    [postId]: (prev[postId] - 1 + images.length) % images.length,
  }));
};

    useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');

      try {
        const response = await axios.get('https://bondbase.onrender.com/api/user/allUsers',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

   const handleLike = async (postId) => {
    try {
      const response = await axios.put(`https://bondbase.onrender.com/api/posts/like/${postId}`, { userId: id });

      const response2 = await axios.get("https://bondbase.onrender.com/api/posts/allPosts");
    setFormData(response2.data);

    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
  try {
    await axios.delete(`https://bondbase.onrender.com/api/posts/${postId}`, {
      data: { userId: id }
    });
    setFormData(prev => prev.filter(p => p._id !== postId));
  } catch (error) {
    console.error('Error deleting post:', error);
  }
};

const handleDeleteComment = async (postId, commentId) => {
  const id = localStorage.getItem('id');
  if (!id) return console.error("User ID not found in localStorage");

  try {
    console.log("Deleting comment:", postId, commentId, id);
    const response = await axios.delete(
      `https://bondbase.onrender.com/api/posts/delete/comment/${postId}/${commentId}/${id}`
    );

    setFormData(prev =>
      prev.map(p =>
        p._id === postId ? { ...p, comments: response.data.comments } : p
      )
    );
  } catch (error) {
    console.error('Error deleting comment:', error.response?.data || error.message);
  }
};


const handleDeleteReply = async (postId, commentId, replyId) => {
  const id = localStorage.getItem("id");
  if (!id) return;

  try {
    const response = await axios.delete(
      `https://bondbase.onrender.com/api/posts/delete/reply/${postId}/${commentId}/${replyId}/${id}`
    );

    const updatedComment = response.data.comment;

    setFormData(prev =>
      prev.map(p =>
        p._id === postId
          ? {
              ...p,
              comments: p.comments.map(c =>
                c._id === commentId ? updatedComment : c
              )
            }
          : p
      )
    );
  } catch (error) {
    console.error('Error deleting reply:', error.response?.data || error.message);
  }
};



 const handleComment = async (postId) => { 
  if (!commentInput[postId]) return;

  try {
    await axios.post(`https://bondbase.onrender.com/api/posts/comment/${postId}`, {
      userId: id,
      text: commentInput[postId]
    });

    // Re-fetch all posts from your backend
    const allPostsResponse = await axios.get("https://bondbase.onrender.com/api/posts/allPosts");
    setFormData(allPostsResponse.data);

    setCommentInput(prev => ({ ...prev, [postId]: '' }));
  } catch (err) {
    console.error(err);
  }
};


  const handleReply = async (postId, commentId) => {
  if (!replyInput[commentId]) return;

  try {
    const response = await axios.post(`https://bondbase.onrender.com/api/posts/reply/${postId}/${commentId}`, {
      userId: id,
      text: replyInput[commentId]
    });

    const updatedPost = response.data;
    console.log(response.data);
    setFormData(prev =>
      prev.map(p => (p._id === updatedPost._id ? updatedPost : p))
    );
    setReplyInput(prev => ({ ...prev, [commentId]: '' }));
    setShowReplyBox(prev => ({ ...prev, [commentId]: false }));
  } catch (err) {
    console.error(err);
  }
};

const getRelativeTime = (date) => {
  const now = new Date();
  const posted = new Date(date);
  const seconds = Math.floor((now - posted) / 1000);

  const intervals = {
    year: 31536000,
    mon: 2592000,
    w: 604800,
    d: 86400,
    h: 3600,
    m: 60,
    s: 1,
  };

  for (const key in intervals) {
    const interval = Math.floor(seconds / intervals[key]);
    if (interval >= 1) {
      return `${interval}${key}${interval > 1 ? '' : ''}`;
    }
  }
  return 'just now';
};


useEffect(() => {
  const userId = localStorage.getItem('id');
  setId(userId);

  const fetchData = async () => {
    try {
      const response = await axios.get('https://bondbase.onrender.com/api/posts/allPosts');
      console.log(response.data)
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  fetchData();

  // Socket.io connection
  const socket = io('https://bondbase.onrender.com', {
    withCredentials: true,
  });

  // 🔴 Listen for real-time events
  socket.on('newPost', (newPost) => {
    setFormData((prev) => [newPost, ...prev]);
  });

  socket.on('postLiked', ({ postId, likes }) => {
    setFormData((prev) =>
      prev.map((post) =>
        post._id === postId ? { ...post, likes } : post
      )
    );
  });

  socket.on('postCommented', ({ postId, comments }) => {
    setFormData((prev) =>
      prev.map((post) =>
        post._id === postId ? { ...post, comments } : post
      )
    );
  });

  socket.on('commentReplied', ({ postId, commentId, replies }) => {
    setFormData((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment._id === commentId
                  ? { ...comment, replies }
                  : comment
              ),
            }
          : post
      )
    );
  });

  // Clean up on unmount
  return () => {
    socket.disconnect();
  };
}, []);

  

  return (
    <div className='text-[rgb(17,24,39)]  min-h-screen'>
      {/* Hero Section */}
      {/* <section className='mt-20 text-center px-4'>
        <h1 className='text-5xl font-bold'>BondBase</h1>
        <p className='text-md mt-2 text-[#989c9f] font-medium'>Beyond Posts. Build Presence.</p>
        <p className='mt-6 text-lg max-w-2xl mx-auto'>
          Where ideas meet people. BondBase lets you share, connect, and grow in a space built for creators, thinkers, and everyday voices.
        </p>
      </section> */}

      
 <div className='mt-24 px-6'>
        {/* <h2 className='text-3xl font-semibold text-center mb-8'>Recent Posts</h2> */}
        <div className='flex flex-col w-[50%] m-auto gap-6'>
          {formData && formData.length > 0 ? (
formData
  .filter(post => 
  post?.userId?._id !== id 
   &&
     (
     post?.userId?.privacy === "public" ||                       //remember to uncomment this
       post.userId?.followers.includes(id)
     )
  )
  .reverse().map((post, index) => (
              <div key={index} className='bg-[#ffffff] px-3 py-2 rounded-xl border-1 border-gray-300 transition'>
                <div className='flex items-center '>
                  <img
                    src={post.userId?.profilePhoto || '/default-profile.png'}
                    alt='Profile'
                    className='w-10 h-10 rounded-full mr-3 object-cover'
                  />
                  <div>
                    <Link to={`/user/${post.userId?._id}`}><p className='font-semibold hover:underline transition-all duration-200'>{post.userId?.firstName} {post.userId?.lastName}</p></Link>
                    <p className='text-sm text-gray-500'>{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className='w-full bg-gray-300 h-[0.5px] my-2'></div>
                <p className='text-gray-800 mb-3 text-[15px]'>{post.description}</p>

            {post.images?.length > 0 && (
  <div className="relative w-[100%] max-w-xl mx-auto">
    <div className="relative">
      <img
        src={post.images[currentImageIndex[post._id] || 0]}
        alt={`Post ${post._id}`}
        className="max-h-[500px] bg-gray-100 w-full object-contain rounded-lg"
      />
      {/* {post.images.length > 1 && (
        <>
          <button
            onClick={() => prevImage(post._id, post.images)}
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full"
          >
            ‹
          </button>
          <button
            onClick={() => nextImage(post._id, post.images)}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full"
          >
            ›
          </button>
        </>
      )} */}
    </div>

    {/* Dots Navigation */}
    <div className="flex justify-center gap-2 mt-2">
      {post.images.map((_, index) => (
        <button
          key={index}
          className={`h-2 w-2 rounded-full cursor-pointer ${
            (currentImageIndex[post._id] || 0) === index
              ? 'bg-blue-500'
              : 'bg-gray-300'
          }`}
          onClick={() =>
            setCurrentImageIndex((prev) => ({
              ...prev,
              [post._id]: index,
            }))
          }
        />
      ))}
    </div>
  </div>
)}


    <div className='flex justify-between items-center mx-4 text-gray-500'>
      <div className='text-[13px]'>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</div>
      <div className='text-[13px]'>{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</div>
    </div>

         <div className='h-[0.5px] bg-gray-300 mt-2'></div>

        <div className='flex justify-around items-center mt-3 mb-1'>
          <div className='flex items-center gap-2'>
              <button onClick={() => handleLike(post._id)}>
                    {post.likes.includes(id) ? (
                      <FaHeart className='text-red-500 text-xl cursor-pointer' />
                    ) : (
                      <FaRegHeart className='text-gray-500 text-xl cursor-pointer' />
                    )}
                  </button>
                  <div>Like</div>
          </div>
          <div className='flex items-center gap-2 cursor-pointer' onClick={() =>
  setCommentBox((prev) => ({
    ...prev,
    [post._id]: !prev[post._id],
  }))
}
>
            <FaRegCommentDots size={20}/>
            <div>Comment</div>
          </div>

        </div>
                {/* Like Button */}
                {/* <div className='mt-4 flex items-center gap-3'>
                  <button onClick={() => handleLike(post._id)}>
                    {post.likes.includes(id) ? (
                      <FaHeart className='text-red-500 text-xl cursor-pointer' />
                    ) : (
                      <FaRegHeart className='text-gray-500 text-xl cursor-pointer' />
                    )}
                  </button>
                  <span>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</span>
                </div> */}

                {/* Comments */}
          {commentBox[post._id] && (
          <div className='mt-4' >
            <div className='flex items-center gap-2'>
                  <input
                    type='text'
                    placeholder='Add a comment...'
                    value={commentInput[post._id] || ''}
                    onChange={(e) =>
                      setCommentInput(prev => ({ ...prev, [post._id]: e.target.value }))
                    }
                    className='w-full border px-3 py-1 rounded-md'
                  />
                  <button
                    onClick={() => handleComment(post._id)}
                    className=' bg-blue-500 text-white px-3 py-1 cursor-pointer rounded-md hover:bg-blue-600'
                  >
                    Comment
                  </button>
                 </div>
                  <div className='mt-3 max-h-40 overflow-y-auto mx-3'>
                  <div className='font-semibold text-[12px] text-gray-700 my-1'>{post.comments.length === 0 ? 'No comments yet' : 'Comments'}</div>
{[...post.comments].reverse().map((c, i) => (
  <div key={i} className='mb-2 mx-1 relative'>
    <div className='text-sm text-gray-700'>
      <div className='font-semibold flex items-center justify-between'>
       <div>{c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'User'} </div>  
    <div className='flex items-center justify-center gap-1'><div className='text-[12px] text-gray-700'>{getRelativeTime(c.createdAt)}</div> <div onClick={()=>toggleMenu(c._id)} className='cursor-pointer hover:bg-gray-100 rounded-full p-1'><BsThreeDots size={16} className=''/></div></div>    
      </div> 
      {/*  */}
    
    </div>
    <div className='text-sm text-gray-700 ml-1'>
    {c.text}  
    </div>

    {openMenu[c._id] ?  (
     <div className=' bg-white border-[0.1px] border-gray-600 w-[100px] h-[60px] flex flex-col justify-center items-center px-3 py-2 absolute top-[-15px] right-10 rounded-md font-semibold shadow-lg gap-2'>
     { c.userId._id === id  && (
      <button
        onClick={() => handleDeleteComment(post._id, c._id)}
        className='text-gray-700 text-xs  cursor-pointer'
      >
        Delete
      </button>
    )} 
    <button
      onClick={() =>
        setShowReplyBox(prev => ({ ...prev, [c._id]: !prev[c._id] }))
      }
      className='text-gray-700 text-xs  cursor-pointer'
    >
      {showReplyBox[c._id] ? 'Cancel' : 'Reply'}
    </button>
    </div>)
    : null
    
    }  
    
    

    {/* Reply Input */}
    {showReplyBox[c._id] && (
      <div className='mt-1 '>
        <input
          type='text'
          placeholder='Write a reply...'
          value={replyInput[c._id] || ''}
          onChange={(e) =>
            setReplyInput(prev => ({ ...prev, [c._id]: e.target.value }))
          }
          className='w-full border px-2 py-1 rounded-md text-sm'
        />
        <button
          onClick={() => handleReply(post._id, c._id)}
          className='mt-1 bg-green-500 text-white px-2 py-1 text-xs cursor-pointer rounded hover:bg-green-600'
        >
          Reply
        </button>
      </div>
    )}

    {/* Render Replies */}
    {c.replies && c.replies.length > 0 && (
      <div className=''>
        <button
          onClick={() =>
            setShowReplies(prev => ({ ...prev, [c._id]: !prev[c._id] }))
          }
          className='text-indigo-500 text-xs mb-1 cursor-pointer'
        >
          {showReplies[c._id] ? 'Hide Replies' : `View Replies (${c.replies.length})`}
        </button>

        {showReplies[c._id] && (
          <div className='mt-1 space-y-1'>
           {[...c.replies].reverse().map((r, j) => {
  const replyUserId = typeof r.userId === 'object' ? r.userId._id : r.userId;

  return (
    <div key={j} className='text-xs text-gray-600 ml-5 flex items-center justify-between'>
      <div className='flex items-start justify-center gap-2'>
         <div>
      <div className='font-semibold'>
        {r.name?.firstName || r.userId?.firstName || 'User'} {r.name?.lastName || r.userId?.lastName || ''}
      </div> 
      {/* <p className='text-[10px] text-gray-400 ml-1'>
      </p> */}

      <div className='ml-1'>
        {r.text}
      </div>
      </div>

      <div>
         {getRelativeTime(r.createdAt)}
      </div>
      </div>

      
      <div>
        {(id === replyUserId && post.userId._id !== id) && (
        <button
          onClick={() => handleDeleteReply(post._id, c._id, r._id)}
          className='bg-red-600 text-white px-2 py-1 rounded-md text-xs ml-2 cursor-pointer'
        >
          Delete
        </button>
      )}
      </div>
    </div>
  );
})}


          </div>
        )}
      </div>
    )}
  </div>
))}

</div>

                </div>
            )}      
              </div>
            ))
          ) : (
            <p className='text-center text-gray-500 col-span-full'>No posts to display.</p>
          )}
        </div>
      </div>



      {/* Footer */}
      <footer className='mt-24 px-4 py-10 border-t border-gray-200 text-center text-[#6b7280] text-sm'>
        <p>© 2025 BondBase. All rights reserved.</p>
        <div className='mt-2'>
          <a href='#' className='mx-2 hover:underline'>Community</a>
          <a href='#' className='mx-2 hover:underline'>Guidelines</a>
          <a href='#' className='mx-2 hover:underline'>Feedback</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;