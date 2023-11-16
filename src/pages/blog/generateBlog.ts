import { faker } from "@faker-js/faker";

interface FeaturedArticle {
  id: string;
    title: string;
    summary: string;
    publishedDate: string;
    readTime: string;
    category: string;
    imageUrl: string;
    articleUrl: string;
    slug: string;
    authorPhoto:string;
    authorName:string;

}

interface FeaturedArticleData {
  featuredArticle: FeaturedArticle[];
}

interface LatestArticle {
    id: string;
    title: string;
    summary: string;
    publishedDate: string;
    readTime: string;
    category: string;
    imageUrl: string;
    articleUrl: string;
    slug: string;
    authorPhoto:string;
    authorName:string;
}

interface LatestArticlesData {
  latestArticles: LatestArticle[];
}
let featuredArticle: FeaturedArticle[] = [];
  for (let i = 0; i < 1; i++) {
    featuredArticle.push({
      id: faker.string.uuid(),
        title: faker.lorem.sentence(),
        summary: faker.lorem.paragraph(),
        publishedDate: faker.date.past().toISOString(),
        readTime: `${faker.number.int({ min: 10, max: 10 })} min read`,
        category: faker.lorem.word(),
        imageUrl: faker.image.url(),
        articleUrl: `/blog/featured/${faker.lorem.slug()}`,
        slug: faker.lorem.slug(),
        authorPhoto:"https://www.astro.build/_astro/elian.833ec9a6.webp",
        authorName: faker.person.fullName(),
    });
  }
  let latestArticles: LatestArticle[] = [];
  for (let i = 0; i < 150; i++) {
    latestArticles.push({
      id: faker.string.uuid(),
        title: faker.lorem.sentence(),
        summary: faker.lorem.paragraph(),
        publishedDate: faker.date.past().toISOString(),
        readTime: `${faker.number.int({ min: 10, max: 10 })} min read`,
        category: faker.lorem.word(),
        imageUrl: faker.image.url(),
        articleUrl: `/blog/${faker.lorem.slug()}`,
        slug: faker.lorem.slug(),
        authorPhoto:"https://www.astro.build/_astro/elian.833ec9a6.webp",
        authorName: faker.person.fullName(),

    });
  }

  export const featuredArticleData: FeaturedArticleData = { featuredArticle };
  export const latestArticlesData: LatestArticlesData = { latestArticles };