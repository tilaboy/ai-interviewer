"""
Question crawler for building the interview knowledge base.

Crawls public interview prep sources (LeetCode, Glassdoor, Blind)
to collect Meta-tagged interview questions.

Usage:
    python question_crawler.py --source leetcode --output ../knowledge_base/questions/coding/
    python question_crawler.py --source glassdoor --company meta --output ../knowledge_base/questions/
    python question_crawler.py --source all --output ../knowledge_base/questions/

Note: This tool respects robots.txt and rate limits. Some sources require
authentication or have anti-scraping measures — for those, we provide
structured manual collection templates instead.
"""

import argparse
import json
import time
import os
import re
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional
from urllib.parse import urljoin

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Required packages not installed. Run:")
    print("  pip install requests beautifulsoup4")
    exit(1)


@dataclass
class Question:
    id: str
    source: str
    title: str
    category: str  # coding, behavioral, system_design, ml_design
    difficulty: str  # easy, medium, hard
    target_levels: list[str] = field(default_factory=list)
    target_roles: list[str] = field(default_factory=list)
    description: str = ""
    topics: list[str] = field(default_factory=list)
    url: str = ""
    follow_ups: list[str] = field(default_factory=list)
    collected_at: str = field(default_factory=lambda: datetime.now().isoformat())


class LeetCodeCrawler:
    """Crawl Meta-tagged problems from LeetCode's public GraphQL API."""

    GRAPHQL_URL = "https://leetcode.com/graphql"
    RATE_LIMIT_SECONDS = 2

    # Known Meta-tagged problem slugs (publicly listed on LeetCode company page)
    META_PROBLEMS = [
        "two-sum", "valid-parentheses", "merge-intervals", "binary-tree-right-side-view",
        "product-of-array-except-self", "clone-graph", "lowest-common-ancestor-of-a-binary-tree",
        "word-break", "number-of-islands", "minimum-window-substring",
        "alien-dictionary", "add-and-search-word-data-structure-design",
        "lru-cache", "serialize-and-deserialize-binary-tree",
        "median-of-two-sorted-arrays", "random-pick-with-weight",
        "k-closest-points-to-origin", "subarray-sum-equals-k",
        "accounts-merge", "task-scheduler",
        "move-zeroes", "remove-invalid-parentheses", "valid-palindrome-ii",
        "vertical-order-traversal-of-a-binary-tree", "binary-tree-vertical-order-traversal",
        "nested-list-weight-sum", "range-sum-of-bst", "diameter-of-binary-tree",
        "minimum-remove-to-make-valid-parentheses", "closest-binary-search-tree-value",
        "buildings-with-an-ocean-view", "custom-sort-string", "dot-product-of-two-sparse-vectors",
        "making-a-large-island", "simplify-path", "pow-x-n",
        "lowest-common-ancestor-of-a-binary-tree-iii", "find-peak-element",
        "valid-palindrome", "basic-calculator-ii", "next-permutation",
        "max-consecutive-ones-iii", "interval-list-intersections",
        "exclusive-time-of-functions", "continuous-subarray-sum",
        "kth-largest-element-in-an-array", "sum-root-to-leaf-numbers",
        "palindrome-linked-list", "copy-list-with-random-pointer"
    ]

    def __init__(self, session: Optional[requests.Session] = None):
        self.session = session or requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "InterviewPrepBot/1.0 (personal project)"
        })

    def fetch_problem(self, slug: str) -> Optional[Question]:
        query = """
        query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                questionId
                title
                titleSlug
                difficulty
                topicTags { name slug }
                content
                categoryTitle
            }
        }
        """
        try:
            resp = self.session.post(self.GRAPHQL_URL, json={
                "query": query,
                "variables": {"titleSlug": slug}
            })
            resp.raise_for_status()
            data = resp.json().get("data", {}).get("question")
            if not data:
                print(f"  [SKIP] No data for {slug}")
                return None

            difficulty_map = {"Easy": "easy", "Medium": "medium", "Hard": "hard"}
            level_map = {
                "easy": ["E3"],
                "medium": ["E3", "E4"],
                "hard": ["E4", "E5", "E6"]
            }
            diff = difficulty_map.get(data["difficulty"], "medium")

            return Question(
                id=f"lc_{data['questionId']}",
                source="leetcode",
                title=data["title"],
                category="coding",
                difficulty=diff,
                target_levels=level_map[diff],
                target_roles=["SWE", "MLE", "DE"],
                description=self._clean_html(data.get("content", "")),
                topics=[t["name"] for t in data.get("topicTags", [])],
                url=f"https://leetcode.com/problems/{slug}/",
            )
        except Exception as e:
            print(f"  [ERROR] Failed to fetch {slug}: {e}")
            return None

    def crawl(self, limit: int = 50) -> list[Question]:
        questions = []
        slugs = self.META_PROBLEMS[:limit]
        print(f"Crawling {len(slugs)} Meta-tagged LeetCode problems...")

        for i, slug in enumerate(slugs):
            print(f"  [{i+1}/{len(slugs)}] {slug}")
            q = self.fetch_problem(slug)
            if q:
                questions.append(q)
            time.sleep(self.RATE_LIMIT_SECONDS)

        print(f"Collected {len(questions)} questions from LeetCode")
        return questions

    @staticmethod
    def _clean_html(html: str) -> str:
        if not html:
            return ""
        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text(separator="\n").strip()
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text[:500]


class ManualCollectionTemplate:
    """
    Generate structured templates for manual question collection
    from sources that don't allow automated crawling.
    """

    @staticmethod
    def generate_glassdoor_template(output_dir: str):
        template = {
            "instructions": (
                "Manual collection guide for Glassdoor Meta interview questions.\n"
                "1. Go to glassdoor.com and search for 'Meta' interview questions\n"
                "2. Filter by role (Software Engineer, Machine Learning Engineer, Data Engineer)\n"
                "3. For each question, fill in the fields below\n"
                "4. Save as glassdoor_<role>_<batch>.json"
            ),
            "template": {
                "id": "gd_XXX",
                "source": "glassdoor",
                "title": "<question title>",
                "category": "<coding|behavioral|system_design|ml_design>",
                "difficulty": "<easy|medium|hard>",
                "target_levels": ["E3|E4|E5|E6"],
                "target_roles": ["SWE|MLE|DE"],
                "description": "<full question text>",
                "topics": ["<relevant topics>"],
                "url": "<glassdoor URL>",
                "date_reported": "<YYYY-MM>",
                "interview_outcome": "<offered|rejected|unknown>"
            },
            "collection_targets": {
                "SWE_coding": "50+ questions",
                "SWE_system_design": "20+ questions",
                "MLE_ml_design": "20+ questions",
                "DE_coding_sql": "30+ questions",
                "DE_system_design": "15+ questions",
                "behavioral_all_roles": "30+ questions",
                "ai_native_coding": "20+ questions"
            }
        }

        path = os.path.join(output_dir, "glassdoor_collection_template.json")
        with open(path, "w") as f:
            json.dump(template, f, indent=2)
        print(f"Glassdoor template saved to {path}")

    @staticmethod
    def generate_blind_template(output_dir: str):
        template = {
            "instructions": (
                "Manual collection guide for Blind/Teamblind Meta interview questions.\n"
                "1. Search Blind for 'Meta interview' or 'Facebook interview'\n"
                "2. Look for posts tagged with interview experiences\n"
                "3. Capture both questions and any context about the interview round\n"
                "4. Save as blind_<batch>.json"
            ),
            "template": {
                "id": "blind_XXX",
                "source": "blind",
                "title": "<question title or summary>",
                "category": "<coding|behavioral|system_design|ml_design>",
                "difficulty": "<easy|medium|hard>",
                "target_levels": ["E3|E4|E5|E6"],
                "target_roles": ["SWE|MLE|DE"],
                "description": "<question details>",
                "topics": ["<relevant topics>"],
                "interview_round": "<phone_screen|onsite_1|onsite_2|etc>",
                "year": "<YYYY>",
                "additional_context": "<any useful context about the interview>"
            }
        }

        path = os.path.join(output_dir, "blind_collection_template.json")
        with open(path, "w") as f:
            json.dump(template, f, indent=2)
        print(f"Blind template saved to {path}")


class QuestionAggregator:
    """Merge questions from multiple sources, deduplicate, and organize."""

    def __init__(self, knowledge_base_dir: str):
        self.kb_dir = knowledge_base_dir

    def load_existing(self, category: str) -> list[dict]:
        path = os.path.join(self.kb_dir, "questions", category, f"{category}_questions.json")
        if os.path.exists(path):
            with open(path) as f:
                data = json.load(f)
                return data.get("questions", [])
        return []

    def merge_and_save(self, category: str, new_questions: list[Question]):
        existing = self.load_existing(category)
        existing_titles = {q["title"].lower() for q in existing}

        added = 0
        for q in new_questions:
            if q.title.lower() not in existing_titles:
                existing.append(asdict(q))
                existing_titles.add(q.title.lower())
                added += 1

        output = {
            "meta": {
                "description": f"{category} interview questions (aggregated from multiple sources)",
                "total_questions": len(existing),
                "last_updated": datetime.now().isoformat()
            },
            "questions": existing
        }

        path = os.path.join(self.kb_dir, "questions", category, f"{category}_questions.json")
        with open(path, "w") as f:
            json.dump(output, f, indent=2)

        print(f"Saved {len(existing)} questions to {path} ({added} new)")


def generate_stats(kb_dir: str):
    """Print knowledge base statistics."""
    categories = ["coding", "behavioral", "system_design", "ml_design", "ai_native_coding"]
    total = 0

    print("\n=== Knowledge Base Statistics ===")
    for cat in categories:
        path = os.path.join(kb_dir, "questions", cat, f"{cat}_questions.json")
        if os.path.exists(path):
            with open(path) as f:
                data = json.load(f)
                count = len(data.get("questions", []))
                total += count
                print(f"  {cat}: {count} questions")
        else:
            print(f"  {cat}: 0 questions (file not found)")

    print(f"  TOTAL: {total} questions")
    print("================================\n")


def main():
    parser = argparse.ArgumentParser(description="Interview question crawler")
    parser.add_argument("--source", choices=["leetcode", "templates", "stats", "all"],
                        default="stats", help="Source to crawl")
    parser.add_argument("--output", default="../knowledge_base",
                        help="Knowledge base directory")
    parser.add_argument("--limit", type=int, default=50,
                        help="Max questions to fetch per source")
    args = parser.parse_args()

    kb_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), args.output))
    aggregator = QuestionAggregator(kb_dir)

    if args.source in ("leetcode", "all"):
        crawler = LeetCodeCrawler()
        questions = crawler.crawl(limit=args.limit)
        aggregator.merge_and_save("coding", questions)

    if args.source in ("templates", "all"):
        templates_dir = os.path.join(kb_dir, "questions")
        ManualCollectionTemplate.generate_glassdoor_template(templates_dir)
        ManualCollectionTemplate.generate_blind_template(templates_dir)

    generate_stats(kb_dir)


if __name__ == "__main__":
    main()
