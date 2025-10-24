package com.hoanghuy04.instagrambackend;

import com.hoanghuy04.instagrambackend.entity.*;
import com.hoanghuy04.instagrambackend.enums.MediaType;
import com.hoanghuy04.instagrambackend.enums.NotificationType;
import com.hoanghuy04.instagrambackend.enums.UserRole;
import com.hoanghuy04.instagrambackend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Application initialization class that runs on startup.
 * Creates sample data for development and testing purposes.
 * 
 * @author Instagram Backend Team
 * @version 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InitApp implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final FollowRepository followRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        log.info("Starting application initialization...");
        
        // Check if data already exists
        if (userRepository.count() > 0) {
            log.info("Database already contains data, skipping initialization");
            return;
        }
        
        try {
            // Clear any existing data first to prevent conflicts
            clearExistingData();
            
            initializeUsers();
            initializePosts();
            initializeComments();
            initializeFollows();
            initializeNotifications();
            
            log.info("Application initialization completed successfully");
        } catch (Exception e) {
            log.error("Error during application initialization", e);
        }
    }
    
    /**
     * Clear any existing data to prevent conflicts
     */
    private void clearExistingData() {
        log.info("Clearing existing data...");
        
        notificationRepository.deleteAll();
        likeRepository.deleteAll();
        commentRepository.deleteAll();
        followRepository.deleteAll();
        postRepository.deleteAll();
        userRepository.deleteAll();
        
        log.info("Existing data cleared");
    }
    
    /**
     * Initialize sample users including admin and regular users
     */
    private void initializeUsers() {
        log.info("Initializing users...");
        
        // Create admin user
        UserProfile adminProfile = UserProfile.builder()
                .firstName("Admin")
                .lastName("User")
                .bio("System Administrator")
                .avatar("https://via.placeholder.com/150/007bff/ffffff?text=A")
                .location("System")
                .build();
        
        User admin = User.builder()
                .username("admin")
                .email("admin@instagram.com")
                .password(passwordEncoder.encode("admin123"))
                .profile(adminProfile)
                .roles(Set.of(UserRole.ADMIN, UserRole.USER))
                .isPrivate(false)
                .isVerified(true)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
        
        userRepository.save(admin);
        log.info("Created admin user: {}", admin.getUsername());
        
        // Create sample users
        List<User> sampleUsers = createSampleUsers();
        userRepository.saveAll(sampleUsers);
        log.info("Created {} sample users", sampleUsers.size());
    }
    
    /**
     * Create sample users with realistic data
     */
    private List<User> createSampleUsers() {
        List<User> users = new ArrayList<>();
        
        String[][] userData = {
            {"john_doe", "john@example.com", "John", "Doe", "Photography enthusiast 📸", "https://via.placeholder.com/150/28a745/ffffff?text=J", "New York, NY"},
            {"jane_smith", "jane@example.com", "Jane", "Smith", "Travel blogger ✈️", "https://via.placeholder.com/150/dc3545/ffffff?text=J", "Los Angeles, CA"},
            {"mike_wilson", "mike@example.com", "Mike", "Wilson", "Fitness coach 💪", "https://via.placeholder.com/150/ffc107/ffffff?text=M", "Miami, FL"},
            {"sarah_jones", "sarah@example.com", "Sarah", "Jones", "Food lover 🍕", "https://via.placeholder.com/150/17a2b8/ffffff?text=S", "Chicago, IL"},
            {"alex_brown", "alex@example.com", "Alex", "Brown", "Tech enthusiast 💻", "https://via.placeholder.com/150/6f42c1/ffffff?text=A", "Seattle, WA"},
            {"emma_davis", "emma@example.com", "Emma", "Davis", "Artist 🎨", "https://via.placeholder.com/150/fd7e14/ffffff?text=E", "Portland, OR"},
            {"david_miller", "david@example.com", "David", "Miller", "Musician 🎵", "https://via.placeholder.com/150/20c997/ffffff?text=D", "Austin, TX"},
            {"lisa_garcia", "lisa@example.com", "Lisa", "Garcia", "Fashion designer 👗", "https://via.placeholder.com/150/e83e8c/ffffff?text=L", "New York, NY"}
        };
        
        for (String[] data : userData) {
            UserProfile profile = UserProfile.builder()
                    .firstName(data[2])
                    .lastName(data[3])
                    .bio(data[4])
                    .avatar(data[5])
                    .location(data[6])
                    .build();
            
            User user = User.builder()
                    .username(data[0])
                    .email(data[1])
                    .password(passwordEncoder.encode("password123"))
                    .profile(profile)
                    .roles(Set.of(UserRole.USER))
                    .isPrivate(Math.random() < 0.3) // 30% chance of private account
                    .isVerified(Math.random() < 0.2) // 20% chance of verified account
                    .isActive(true)
                    .createdAt(LocalDateTime.now().minusDays((long) (Math.random() * 365)))
                    .build();
            
            users.add(user);
        }
        
        return users;
    }
    
    /**
     * Initialize sample posts
     */
    private void initializePosts() {
        log.info("Initializing posts...");
        
        List<User> users = userRepository.findAll();
        if (users.isEmpty()) {
            log.warn("No users found, skipping post initialization");
            return;
        }
        
        List<Post> posts = new ArrayList<>();
        
        // Create posts for each user
        for (User user : users) {
            int postCount = 5; // 5 posts per user
            
            for (int i = 0; i < postCount; i++) {
                Post post = createSamplePost(user);
                posts.add(post);
            }
        }
        
        postRepository.saveAll(posts);
        log.info("Created {} sample posts", posts.size());
    }
    
    /**
     * Create a sample post for a user
     */
    private Post createSamplePost(User author) {
        String[] captions = {
            "Beautiful sunset today! 🌅",
            "Coffee and coding ☕️💻",
            "Weekend vibes 🎉",
            "New adventure begins! 🚀",
            "Throwback to amazing memories 📸",
            "Working hard, playing harder 💪",
            "Food coma achieved 🍕",
            "Art in progress 🎨",
            "Music is life 🎵",
            "Travel dreams ✈️"
        };
        
        String[] locations = {
            "New York, NY", "Los Angeles, CA", "Miami, FL", "Chicago, IL", 
            "Seattle, WA", "Portland, OR", "Austin, TX", "San Francisco, CA"
        };
        
        String[] tags = {
            "#photography", "#lifestyle", "#travel", "#food", "#art", 
            "#music", "#fitness", "#nature", "#city", "#friends"
        };
        
        // Create media for the post
        List<Media> media = new ArrayList<>();
        int mediaCount = (int) (Math.random() * 3) + 1; // 1-3 media items per post
        
        for (int i = 0; i < mediaCount; i++) {
            Media mediaItem = Media.builder()
                    .url("https://picsum.photos/800/600?random=" + System.currentTimeMillis() + i)
                    .type(Math.random() < 0.8 ? MediaType.IMAGE : MediaType.VIDEO)
                    .uploadedAt(LocalDateTime.now().minusHours((long) (Math.random() * 168))) // Within last week
                    .build();
            media.add(mediaItem);
        }
        
        // Create random tags
        List<String> postTags = new ArrayList<>();
        int tagCount = (int) (Math.random() * 5) + 1; // 1-5 tags per post
        Collections.shuffle(Arrays.asList(tags));
        for (int i = 0; i < Math.min(tagCount, tags.length); i++) {
            postTags.add(tags[i]);
        }
        
        return Post.builder()
                .author(author)
                .caption(captions[(int) (Math.random() * captions.length)])
                .media(media)
                .tags(postTags)
                .location(locations[(int) (Math.random() * locations.length)])
                .createdAt(LocalDateTime.now().minusHours((long) (Math.random() * 168)))
                .build();
    }
    
    /**
     * Initialize sample comments
     */
    private void initializeComments() {
        log.info("Initializing comments...");
        
        List<Post> posts = postRepository.findAll();
        List<User> users = userRepository.findAll();
        
        if (posts.isEmpty() || users.isEmpty()) {
            log.warn("No posts or users found, skipping comment initialization");
            return;
        }
        
        List<Comment> comments = new ArrayList<>();
        
        // Create comments for random posts
        for (Post post : posts) {
            int commentCount = 3; // 3 comments per post
            
            for (int i = 0; i < commentCount; i++) {
                User commenter = users.get((int) (Math.random() * users.size()));
                
                String[] commentTexts = {
                    "Amazing! 🔥", "Love this! ❤️", "So beautiful! 😍", 
                    "Great shot! 📸", "Awesome! 👍", "Perfect! ✨",
                    "Incredible! 🤩", "Stunning! 😊", "Fantastic! 🎉"
                };
                
                Comment comment = Comment.builder()
                        .post(post)
                        .author(commenter)
                        .text(commentTexts[(int) (Math.random() * commentTexts.length)])
                        .createdAt(LocalDateTime.now().minusHours((long) (Math.random() * 72)))
                        .build();
                
                comments.add(comment);
            }
        }
        
        commentRepository.saveAll(comments);
        log.info("Created {} sample comments", comments.size());
    }
    
    /**
     * Initialize sample follows
     */
    private void initializeFollows() {
        log.info("Initializing follows...");
        
        List<User> users = userRepository.findAll();
        if (users.size() < 2) {
            log.warn("Not enough users for follow initialization");
            return;
        }
        
        List<Follow> follows = new ArrayList<>();
        Set<String> existingFollows = new HashSet<>();
        
        // Create random follow relationships
        for (User user : users) {
            int followCount = 3; // 3 follows per user
            int userFollows = 0;
            int attempts = 0;
            int maxAttempts = 20; // Prevent infinite loop
            
            while (userFollows < followCount && attempts < maxAttempts) {
                User targetUser = users.get((int) (Math.random() * users.size()));
                String followKey = user.getId() + "_" + targetUser.getId();
                
                // Check if this follow relationship already exists or is self-follow
                if (!targetUser.getId().equals(user.getId()) && 
                    !existingFollows.contains(followKey)) {
                    
                    Follow follow = Follow.builder()
                            .follower(user)
                            .following(targetUser)
                            .createdAt(LocalDateTime.now().minusDays((long) (Math.random() * 30)))
                            .build();
                    follows.add(follow);
                    existingFollows.add(followKey);
                    userFollows++;
                }
                attempts++;
            }
        }
        
        // Save follows individually to handle duplicates gracefully
        int savedFollows = 0;
        for (Follow follow : follows) {
            try {
                followRepository.save(follow);
                savedFollows++;
            } catch (Exception e) {
                log.warn("Skipping duplicate follow relationship: {} -> {}", 
                    follow.getFollower().getUsername(), 
                    follow.getFollowing().getUsername());
            }
        }
        
        log.info("Created {} sample follows", savedFollows);
    }
    
    /**
     * Initialize sample notifications
     */
    private void initializeNotifications() {
        log.info("Initializing notifications...");
        
        List<User> users = userRepository.findAll();
        if (users.isEmpty()) {
            log.warn("No users found, skipping notification initialization");
            return;
        }
        
        List<Notification> notifications = new ArrayList<>();
        
        // Create notifications for each user
        for (User user : users) {
            int notificationCount = 5; // 5 notifications per user
            
            for (int i = 0; i < notificationCount; i++) {
                Notification notification = createSampleNotification(user);
                notifications.add(notification);
            }
        }
        
        notificationRepository.saveAll(notifications);
        log.info("Created {} sample notifications", notifications.size());
    }
    
    /**
     * Create a sample notification
     */
    private Notification createSampleNotification(User user) {
        NotificationType[] types = {NotificationType.LIKE, NotificationType.COMMENT, NotificationType.FOLLOW, NotificationType.MESSAGE};
        String[] messages = {
            "liked your post",
            "commented on your post", 
            "started following you",
            "sent you a message"
        };
        
        List<User> allUsers = userRepository.findAll();
        User otherUser = allUsers.get((int) (Math.random() * allUsers.size()));
        
        NotificationType type = types[(int) (Math.random() * types.length)];
        String message = messages[(int) (Math.random() * messages.length)];
        
        return Notification.builder()
                .user(user)
                .type(type)
                .relatedUser(otherUser)
                .message(message)
                .isRead(Math.random() < 0.7) // 70% chance of being read
                .createdAt(LocalDateTime.now().minusHours((long) (Math.random() * 48)))
                .build();
    }
}
