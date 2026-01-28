import { useParams, Link } from 'react-router-dom';
import './ArticleDetailPage.css';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorBio: string;
  date: string;
  readingTime: string;
  category: string;
  slug: string;
}

const blogPosts: Record<string, BlogPost> = {
  'psychology-deep-work': {
    id: 12,
    title: 'The Psychology of Deep Work: Mastering Focus in a Distracted World',
    excerpt: 'In an age of constant notifications and endless distractions, the ability to focus deeply has become both rare and valuable. Learn the cognitive science behind concentration and practical strategies to reclaim your attention.',
    content: `We live in an age of unprecedented distraction. The average person checks their phone 96 times per day, switches tasks every three minutes, and takes 23 minutes to fully refocus after an interruption. In this environment, the ability to concentrate deeply on cognitively demanding work has become extraordinarily rare—and extraordinarily valuable.

## What Is Deep Work?

Deep work refers to professional activities performed in a state of distraction-free concentration that push your cognitive capabilities to their limit. These efforts create new value, improve your skill, and are hard to replicate.

In contrast, shallow work consists of non-cognitively demanding, logistical-style tasks often performed while distracted. These efforts tend not to create much new value and are easy to replicate.

### Why Deep Work Matters

The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy. As a consequence, the few who cultivate this skill will thrive.

Consider the economics: In our information economy, those who can master hard things quickly and produce at an elite level will succeed. Both abilities depend on deep work.

## The Neuroscience of Focus

Understanding how our brains handle attention helps explain why deep work is so powerful—and why distractions are so damaging.

### The Prefrontal Cortex

Your prefrontal cortex is the CEO of your brain, responsible for executive functions like planning, decision-making, and focused attention. However, it has limited capacity. When you switch tasks, your prefrontal cortex must reconfigure itself, which consumes mental energy and time.

### Attention Residue

Research by Sophie Leroy revealed a phenomenon called "attention residue." When you switch from Task A to Task B, your attention doesn't immediately follow. A residue of your attention remains stuck thinking about Task A. This residue reduces your cognitive performance on Task B.

The more intense the residue, the worse your performance. And the residue is especially thick if Task A was unbounded (no clear stopping point) or if you didn't complete it.

### The Flow State

Psychologist Mihaly Csikszentmihalyi's research on "flow"—a state of complete immersion in an activity—reveals that deep concentration produces not just better work, but also greater satisfaction. People are happiest when they're deeply absorbed in a challenging task, not when they're relaxing or consuming entertainment.

## The Four Philosophies of Deep Work

Different people require different approaches to integrating deep work into their lives. Here are four philosophies to consider:

### 1. The Monastic Philosophy

This approach involves eliminating or radically minimizing shallow obligations. Think of a novelist who disappears for months to write, unreachable by email or phone.

- **Best for**: Those whose primary professional contribution is producing a very specific, high-value output
- **Examples**: Writers, researchers, artists
- **Challenge**: Requires the ability to ignore most communication indefinitely

### 2. The Bimodal Philosophy

This approach involves dividing your time, dedicating clearly defined periods to deep work and leaving the rest for everything else. The minimum unit of deep time tends to be at least one full day.

- **Best for**: People who need regular engagement with the world but can batch it
- **Examples**: Academics who teach some semesters and research others
- **Challenge**: Requires flexibility in your schedule

### 3. The Rhythmic Philosophy

This approach transforms deep work sessions into a simple regular habit. You schedule deep work at the same time every day, making it a routine.

- **Best for**: Those with predictable schedules and limited control over their time
- **Examples**: Writers who write every morning from 5-7 AM
- **Challenge**: May produce less total deep work than bimodal approach

### 4. The Journalistic Philosophy

This approach fits deep work wherever you can into your schedule. Journalists, trained to shift into writing mode on deadline, can do this effectively.

- **Best for**: Those with unpredictable schedules and high self-discipline
- **Examples**: Busy executives, journalists, consultants
- **Challenge**: Requires the ability to switch into deep work mode quickly

## Strategies for Cultivating Deep Work

### Create Rituals

Your mind is a pattern-recognition machine. When you develop rituals around deep work, you reduce the friction required to start and maintain concentration.

Consider specifying:

- **Where you'll work**: A specific room, desk, or even coffee shop
- **How long you'll work**: Set a specific time frame
- **How you'll work**: Rules like no internet, phone in another room
- **How you'll support the work**: Starting with coffee, having snacks ready

### Embrace Boredom

The ability to concentrate intensely is a skill that must be trained. If you constantly give in to distraction when bored, you're training your mind to never tolerate the absence of novelty.

Practice being bored:

- Wait without your phone
- Take walks without podcasts
- Sit with your thoughts during commutes
- Resist the urge to fill every moment with stimulation

### Schedule Every Minute of Your Day

Time blocking forces you to be intentional about how you spend each hour. Without structure, shallow work inevitably fills your time.

The goal isn't to perfectly execute your schedule—interruptions happen. The goal is to maintain thoughtfulness about how you spend your time and to batch similar tasks together.

### Quit Social Media (Or At Least Be Intentional)

Most people use social media without considering the opportunity cost. The time spent scrolling could be spent on deep work, relationships, or genuine leisure.

Apply the craftsman approach to tool selection: Identify the core factors that determine success and happiness in your professional and personal life. Adopt a tool only if its positive impacts substantially outweigh the negative impacts.

### Drain the Shallows

Shallow work is inevitable, but it shouldn't dominate your schedule. Strategies for minimizing it:

- **Batch email processing**: Check at specific times, not constantly
- **Say no more often**: Protect your deep work time
- **Become hard to reach**: Make people invest effort to contact you
- **Set deadlines**: Parkinson's Law says work expands to fill available time

## The Role of Rest in Deep Work

Counterintuitively, one of the most important factors in performing deep work is regular, quality rest.

### Downtime Aids Insights

Your unconscious mind excels at working through complex problems when your conscious mind is disengaged. Many breakthrough insights occur during walks, showers, or other restful activities.

### Downtime Recharges Energy for Deep Work

Attention is a finite resource. Like a muscle, it fatigues with use and requires rest to restore. The directed attention required for deep work is particularly draining.

### The Shutdown Ritual

End each workday with a shutdown ritual—a set of steps you follow at the end of each work session that confirms you've reviewed all open tasks and either completed them, captured them, or scheduled them for later.

A sample ritual:

1. Check email for urgent items requiring response
2. Transfer new tasks to your task list
3. Review your calendar for upcoming deadlines
4. Plan tomorrow's schedule
5. Say a phrase like "shutdown complete" to signal your brain that work is done

## Common Obstacles and Solutions

### "I Need to Be Responsive"

Most knowledge workers overestimate how quickly they need to respond to communications. Experiment with response delays—you'll likely find that most things can wait.

Consider:

- Setting expectations about response times
- Using auto-responders for email
- Scheduling "office hours" for real-time communication
- Batching meetings into specific days

### "I Don't Have Time for Deep Work"

You don't find time for deep work—you make it. This means saying no to things that seem productive but aren't essential.

Track how you actually spend your time for a week. You'll likely discover hours consumed by low-value activities that could be eliminated or reduced.

### "My Job Requires Constant Communication"

Some jobs genuinely require high responsiveness. But even then, you can likely carve out some protected time:

- Early mornings before others are awake
- Late evenings after the workday ends
- One or two hours mid-day with notifications off
- Weekly "focus days" with colleagues covering for you

### "I Can't Focus Even When I Try"

If your attention span has atrophied from years of distraction, rebuilding it takes time. Start small:

- Begin with just 15-20 minutes of focused work
- Gradually increase duration over weeks
- Use a timer to make sessions concrete
- Track your deep work hours to build momentum

## The Deep Work Scorecard

To improve, you need to measure. Consider tracking:

- **Hours of deep work per day/week**: Your primary metric
- **Output per deep work session**: Quality and quantity produced
- **Depth ratio**: Deep work hours / total work hours
- **Streak length**: Consecutive days with deep work sessions

## Building a Deep Work Culture

If you lead a team, consider how to create an environment that supports focus:

- **Hub and spoke offices**: Private workspaces connected to collaboration areas
- **No-meeting days**: Company-wide protected time for focused work
- **Communication norms**: Async-first communication, batched meetings
- **Lead by example**: Visibly prioritize your own deep work

## Conclusion

The ability to perform deep work is both valuable and rare. Those who cultivate this skill will produce better work, develop expertise faster, and find more meaning in their professional lives.

The strategies outlined here aren't meant to eliminate all shallow work—some is necessary. Instead, the goal is to be intentional about how you allocate your finite attention and to protect time for the cognitively demanding work that truly moves the needle.

Start small. Pick one strategy. Protect one hour tomorrow for focused work. Build from there. In a world increasingly dominated by distraction, your ability to concentrate is your competitive advantage. Protect it fiercely.

Remember: A deep life is a good life.`,
    author: 'Dr. James Chen',
    authorBio: 'Cognitive scientist and productivity researcher specializing in attention, focus, and knowledge work optimization. Author of "The Focused Mind" and consultant to Fortune 500 companies.',
    date: 'December 28, 2024',
    readingTime: '14 min read',
    category: 'Productivity',
    slug: 'psychology-deep-work'
  },
  'science-of-habits': {
    id: 11,
    title: 'The Science of Habits: How Small Changes Lead to Remarkable Results',
    excerpt: 'Why understanding how habits work is the key to transforming your life—one small step at a time. Discover the habit loop, the four laws of behavior change, and practical strategies to build better habits.',
    content: `We are creatures of habit. Studies suggest that approximately 40-45% of our daily actions are habitual—performed almost automatically without conscious thought. From the moment we wake up to when we go to sleep, habits shape our lives in profound ways. Understanding the science behind habits can unlock the door to lasting personal transformation.

## What Is a Habit?

A habit is a behavior that has been repeated enough times to become automatic. When you first learned to drive a car, every action required intense concentration. Now, you can navigate familiar routes while carrying on a conversation, barely thinking about the mechanics of driving. That's the power of habit formation.

### The Neuroscience of Habits

When we repeat a behavior, our brain creates neural pathways that make the action easier to perform. The basal ganglia, a region deep in the brain, plays a crucial role in habit formation. As behaviors become habitual, they shift from the prefrontal cortex (responsible for decision-making) to the basal ganglia, freeing up mental resources for other tasks.

This process, called "chunking," allows the brain to convert a sequence of actions into an automatic routine. It's why habits feel effortless once established—and why they can be so difficult to break.

## The Habit Loop

At the core of every habit is a neurological loop consisting of three components:

### 1. Cue (Trigger)

The cue is what initiates the habit. It can be:

- **Time**: Waking up, lunch break, bedtime
- **Location**: Entering your kitchen, sitting at your desk
- **Emotional state**: Feeling stressed, bored, or happy
- **Other people**: Being with certain friends or colleagues
- **Preceding action**: Finishing a meal, completing a task

### 2. Routine (Behavior)

The routine is the habit itself—the action you take in response to the cue. This can be physical (going for a run), mental (worrying), or emotional (feeling anxious).

### 3. Reward

The reward is what your brain gets from completing the routine. Rewards can be:

- **Physical**: Sugar rush, endorphin release
- **Emotional**: Sense of accomplishment, relief from stress
- **Social**: Approval, connection with others

Understanding this loop is essential because it reveals why habits persist and how they can be changed.

## The Four Laws of Behavior Change

Building on the habit loop concept, behavioral scientists have identified four laws that govern habit formation:

### Law 1: Make It Obvious (Cue)

Your environment shapes your behavior more than you realize. To build good habits:

- **Use implementation intentions**: "I will [BEHAVIOR] at [TIME] in [LOCATION]"
- **Stack habits**: Link new habits to existing ones ("After I pour my morning coffee, I will meditate for one minute")
- **Design your environment**: Make cues for good habits visible (leave your running shoes by the door)

To break bad habits, make the cues invisible. Hide the TV remote, delete social media apps from your phone, or keep junk food out of the house.

### Law 2: Make It Attractive (Craving)

We're more likely to repeat behaviors we find appealing. To make good habits attractive:

- **Use temptation bundling**: Pair a habit you need to do with something you enjoy ("I'll listen to my favorite podcast only while exercising")
- **Join a culture where your desired behavior is normal**: Surround yourself with people who have the habits you want
- **Create a motivation ritual**: Do something you enjoy immediately before a difficult habit

### Law 3: Make It Easy (Response)

The less friction between you and a behavior, the more likely you'll do it:

- **Reduce friction**: Prepare your gym clothes the night before
- **Use the two-minute rule**: When starting a new habit, it should take less than two minutes to do
- **Prime your environment**: Set up spaces for their intended purpose

For bad habits, increase friction. Add steps between you and the behavior. Want to watch less TV? Unplug it after each use and put the remote in a drawer.

### Law 4: Make It Satisfying (Reward)

We repeat behaviors that make us feel good:

- **Use immediate rewards**: Give yourself something enjoyable right after completing a good habit
- **Track your habits**: The visual progress of a habit tracker provides its own reward
- **Never miss twice**: If you miss one day, get back on track immediately

## The Compound Effect of Habits

The remarkable thing about habits is their compound nature. Small improvements, consistently applied, lead to extraordinary results over time.

### The Math of 1% Better

If you get 1% better each day for one year, you'll end up 37 times better by the end. Conversely, if you get 1% worse each day, you'll decline nearly to zero.

- **1% better every day: 1.01^365 = 37.78**
- **1% worse every day: 0.99^365 = 0.03**

This is why habits matter so much. The effects may not be visible day to day, but over months and years, they determine the trajectory of your life.

## Breaking Bad Habits

Understanding the habit loop also reveals strategies for breaking unwanted habits:

### Identify the Cue

Keep a habit journal. When you feel the urge for a bad habit, note:

- What time is it?
- Where are you?
- Who else is around?
- What did you just do?
- How are you feeling?

Patterns will emerge that reveal your triggers.

### Experiment with Rewards

The reward is what the habit actually delivers. If you snack when bored, the reward might not be hunger satisfaction but stimulation. Try different rewards (taking a walk, calling a friend) to identify what craving you're really satisfying.

### Change the Routine

Once you know the cue and the real reward, substitute a new routine that delivers the same reward. This is the golden rule of habit change: keep the cue and reward, change the routine.

## Practical Strategies for Building Better Habits

### Start Incredibly Small

The biggest mistake people make is trying to change too much too fast. Instead:

- Want to read more? Start with one page per day
- Want to meditate? Begin with one minute
- Want to exercise? Start with one push-up

Small habits are easy to start and, once established, can be expanded.

### Stack Your Habits

Connect new habits to existing routines:

- "After I brush my teeth, I will floss one tooth"
- "After I pour my coffee, I will write one sentence in my journal"
- "After I sit down for dinner, I will say one thing I'm grateful for"

### Design Your Environment

Your surroundings have enormous influence on your behavior:

- **For good habits**: Make cues obvious. Want to drink more water? Keep a water bottle on your desk
- **For bad habits**: Make cues invisible. Struggling with phone addiction? Keep it in another room

### Track Your Progress

Habit tracking provides multiple benefits:

- Creates a visual cue that reminds you to act
- Motivates you because you don't want to break the streak
- Provides satisfaction when you record another successful day

### Plan for Failure

Everyone slips up. The key is having a plan:

- **Never miss twice**: One missed day is an accident; two is the start of a new habit
- **Schedule makeup sessions**: If you miss your morning workout, have a backup time
- **Practice self-compassion**: Beating yourself up makes you less likely to continue

## The Identity-Based Approach

The most effective way to change habits is to focus not on what you want to achieve, but on who you want to become:

- Instead of "I want to lose weight," think "I am someone who takes care of their body"
- Instead of "I want to read more," think "I am a reader"
- Instead of "I want to quit smoking," think "I am not a smoker"

Every action you take is a vote for the type of person you want to become. Each time you write a page, you're casting a vote for being a writer. Each time you exercise, you're casting a vote for being a healthy person.

## Conclusion

Habits are the compound interest of self-improvement. Getting 1% better every day counts for a lot in the long run. The task is not to achieve perfection but to make continuous small improvements.

Remember these key principles:

- **Habits follow a loop**: Cue → Routine → Reward
- **Make good habits obvious, attractive, easy, and satisfying**
- **Make bad habits invisible, unattractive, difficult, and unsatisfying**
- **Start small and build gradually**
- **Focus on identity, not outcomes**

The power to transform your life lies in understanding and leveraging the science of habits. Start with one small change today. Your future self will thank you.`,
    author: 'Dr. Sarah Mitchell',
    authorBio: 'Behavioral psychologist and author specializing in habit formation, productivity, and personal development. Former researcher at Stanford University.',
    date: 'December 22, 2024',
    readingTime: '12 min read',
    category: 'Lifestyle',
    slug: 'science-of-habits'
  }
};

// Default post for unknown slugs
const defaultPost: BlogPost = {
  id: 0,
  title: 'Post Not Found',
  excerpt: 'The requested blog post could not be found.',
  content: 'The blog post you are looking for does not exist or has been moved. Please check the URL or browse our other posts.',
  author: 'ClassicPC Team',
  authorBio: '',
  date: '',
  readingTime: '',
  category: '',
  slug: ''
};

function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? blogPosts[slug] || defaultPost : defaultPost;
  const isNotFound = post === defaultPost;

  // Simple markdown-like rendering for headers and paragraphs
  const renderContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => {
      // H2 headers
      if (paragraph.startsWith('## ')) {
        return <h2 key={index} className="article-h2">{paragraph.slice(3)}</h2>;
      }
      // H3 headers
      if (paragraph.startsWith('### ')) {
        return <h3 key={index} className="article-h3">{paragraph.slice(4)}</h3>;
      }
      // Lists
      if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
        const items = paragraph.split('\n').filter(line => line.trim());
        const isOrdered = paragraph.startsWith('1. ');
        const ListTag = isOrdered ? 'ol' : 'ul';
        return (
          <ListTag key={index} className="article-list">
            {items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{
                __html: item.replace(/^[-\d.]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }} />
            ))}
          </ListTag>
        );
      }
      // Warning/Note blocks
      if (paragraph.startsWith('**Warning**:') || paragraph.startsWith('**Note**:')) {
        return <div key={index} className="article-warning">{paragraph}</div>;
      }
      // Regular paragraphs with bold text support
      return (
        <p
          key={index}
          className="article-paragraph"
          dangerouslySetInnerHTML={{
            __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          }}
        />
      );
    });
  };

  return (
    <div className="article-detail-page">
      {/* Breadcrumb */}
      <nav className="article-breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/blog">Blog</Link>
        {!isNotFound && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{post.title}</span>
          </>
        )}
      </nav>

      {isNotFound ? (
        <div className="article-not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <h1>Blog Post Not Found</h1>
          <p>The blog post you're looking for doesn't exist or has been moved.</p>
          <Link to="/blog" className="btn btn-primary">Browse All Posts</Link>
        </div>
      ) : (
        <>
          {/* Article Header */}
          <header className="article-header">
            <span className="article-category-badge">{post.category}</span>
            <h1 className="article-title">{post.title}</h1>
            <p className="article-excerpt">{post.excerpt}</p>

            <div className="article-meta">
              <div className="article-author-info">
                <div className="author-avatar-large">
                  {post.author.charAt(0)}
                </div>
                <div className="author-details">
                  <span className="author-name">{post.author}</span>
                  <span className="author-bio">{post.authorBio}</span>
                </div>
              </div>
              <div className="article-stats">
                <span className="article-date">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {post.date}
                </span>
                <span className="article-reading-time">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {post.readingTime}
                </span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <article className="article-content">
            {renderContent(post.content)}
          </article>

          {/* Article Footer */}
          <footer className="article-footer">
            <div className="article-share">
              <span className="share-label">Share this post:</span>
              <div className="share-buttons">
                <button className="share-btn" aria-label="Share on Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button className="share-btn" aria-label="Share on Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="share-btn" aria-label="Share on LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
                <button className="share-btn" aria-label="Copy link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </button>
              </div>
            </div>

            <Link to="/blog" className="back-to-articles">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Back to All Posts
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}

export default BlogDetailPage;
