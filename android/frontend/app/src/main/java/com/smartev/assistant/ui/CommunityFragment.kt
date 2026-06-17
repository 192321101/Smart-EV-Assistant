package com.smartev.assistant.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.smartev.assistant.databinding.FragmentCommunityBinding
import com.smartev.assistant.databinding.ItemForumBinding
import com.smartev.assistant.model.ForumPost
import com.smartev.assistant.model.ForumResponse
import com.smartev.assistant.network.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class CommunityFragment : Fragment() {

    private var _binding: FragmentCommunityBinding? = null
    private val binding get() = _binding!!

    private val forumPostsList = mutableListOf<ForumPost>()
    private lateinit var adapter: ForumAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCommunityBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.forumRecycler.layoutManager = LinearLayoutManager(context)
        adapter = ForumAdapter(forumPostsList)
        binding.forumRecycler.adapter = adapter

        binding.submitPostBtn.setOnClickListener {
            publishPost()
        }

        loadForumPosts()
    }

    private fun loadForumPosts() {
        ApiClient.getApiService().getForumPosts().enqueue(object : Callback<ForumResponse> {
            override fun onResponse(call: Call<ForumResponse>, response: Response<ForumResponse>) {
                if (isAdded && response.isSuccessful && response.body() != null && response.body()!!.success) {
                    forumPostsList.clear()
                    forumPostsList.addAll(response.body()!!.posts ?: emptyList())
                    adapter.notifyDataSetChanged()
                }
            }

            override fun onFailure(call: Call<ForumResponse>, t: Throwable) {}
        })
    }

    private fun publishPost() {
        val title = binding.postTitleInput.text.toString().trim()
        val content = binding.postContentInput.text.toString().trim()

        if (title.isEmpty()) {
            binding.postTitleInput.error = "Title is required"
            return
        }
        if (content.isEmpty()) {
            binding.postContentInput.error = "Content is required"
            return
        }

        binding.submitPostBtn.isEnabled = false
        binding.submitPostBtn.text = "PUBLISHING..."

        val newPost = ForumPost(
            id = null,
            _id = null,
            title = title,
            content = content,
            author = "Amit Sharma", // Using default user author name
            category = "general",
            upvotes = 1,
            commentsCount = 0,
            createdAt = null
        )

        ApiClient.getApiService().createForumPost(newPost).enqueue(object : Callback<ForumResponse> {
            override fun onResponse(call: Call<ForumResponse>, response: Response<ForumResponse>) {
                if (isAdded) {
                    binding.submitPostBtn.isEnabled = true
                    binding.submitPostBtn.text = "Publish to Grid"

                    if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                        binding.postTitleInput.text.clear()
                        binding.postContentInput.text.clear()
                        Toast.makeText(context, "Experience shared on the grid!", Toast.LENGTH_SHORT).show()
                        loadForumPosts()
                    } else {
                        Toast.makeText(context, "Post submission failed", Toast.LENGTH_SHORT).show()
                    }
                }
            }

            override fun onFailure(call: Call<ForumResponse>, t: Throwable) {
                if (isAdded) {
                    binding.submitPostBtn.isEnabled = true
                    binding.submitPostBtn.text = "Publish to Grid"
                    Toast.makeText(context, "Connection error: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            }
        })
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // Inner Recycler Adapter for Forum Posts
    private class ForumAdapter(private val list: List<ForumPost>) : RecyclerView.Adapter<ForumAdapter.ViewHolder>() {

        class ViewHolder(val binding: ItemForumBinding) : RecyclerView.ViewHolder(binding.root)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val binding = ItemForumBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return ViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val post = list[position]
            holder.binding.forumTitle.text = post.title
            holder.binding.forumCategory.text = post.category.uppercase()
            holder.binding.forumAuthor.text = "Posted by ${post.author}"
            holder.binding.forumContent.text = post.content
            holder.binding.forumUpvotes.text = "▲ ${post.upvotes ?: 0} Upvotes"
            holder.binding.forumComments.text = "💬 ${post.commentsCount ?: 0} Comments"
        }

        override fun getItemCount() = list.size
    }
}
