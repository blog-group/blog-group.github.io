const moment = require('moment');
const {Component, Fragment} = require('inferno');
const Share = require('./share');
const Donates = require('./donates');
const Comment = require('./comment');
const ArticleLicensing = require('hexo-component-inferno/lib/view/misc/article_licensing');
/**
 * Get the word count of text.
 */
function getWordCount(content) {
    if (typeof content === 'undefined') {
        return 0;
    }
    content = content.replace(/<\/?[a-z][^>]*>/gi, '');
    content = content.trim();
    return content ? (content.match(/[\u00ff-\uffff]|[a-zA-Z]+/g) || []).length : 0;
}

module.exports = class extends Component {
    render() {
        const {config, helper, page, index} = this.props;
        const {article, recommended} = config;
        const {url_for, date, date_xml, __, _p} = helper;

        const cover = page.cover ? url_for(page.cover) : null;

        return <Fragment>

            {/* Main content */}
            <div class="card">
                {/* Thumbnail */}
                {cover ? <div class="card-image">
                    {index ? <a href={url_for(page.link || page.path)} class="image is-7by3">
                        <img class="fill" src={cover} alt={page.title || cover}/>
                    </a> : <span class="image is-7by3">
                        <img class="fill" src={cover} alt={page.title || cover}/>
                    </span>}
                </div> : null}
                <div id="container">
                    <article class={`card-content article${'direction' in page ? ' ' + page.direction : ''}`}
                             role="article">
                        {/* Title */}
                        {page.title !== '' ? <h1 class="title is-3 is-size-4-mobile">
                            {index ? <a class="link-muted" href={url_for(page.link || page.path)}><span
                                    class="article_title">{page.title}</span></a> :
                                <span class="article_title">{page.title}</span>}
                        </h1> : null}
                        {/* 自定义文章信息 */}
                        {
                            !page.customize ?
                                <div class="level article-meta is-mobile is-overflow-x-auto" style="font-size: 15px">
                                    <div class="level-left">
                                        {/* 原创 or 转载 */}
                                        {
                                            page.article_type == '原创' ? <span
                                                    style="float: left;padding: 1px 4px 1px 4px;margin-right: 5px;background-color: #5cb85c;color: white;text-align: center;border-radius:0.25em;font-size: 14px">
                                        {page.article_type}
                                        </span> :
                                                <span
                                                    style="float: left;padding: 1px 4px 1px 4px;margin-right: 5px;background-color: #a9800a;color: white;text-align: center;border-radius:0.25em;font-size: 14px">
                                    {page.article_type}
                                </span>
                                        }
                                        {/* 发布时间 */}
                                        &nbsp;&nbsp;&nbsp;&nbsp;
                                        <img src="/images/date_time.png" style="width: 27px;" title="发布时间"/>
                                        &nbsp;
                                        <span class="article-meta-element">{date(page.date)}</span>
                                        &nbsp;&nbsp;&nbsp;&nbsp;
                                        {/*  作者 */}
                                        <img src="/images/author.svg" style="width: 23px" title="文章作者"/>
                                        &nbsp;
                                        <span class="article-meta-element">{page.article_author}</span>
                                        &nbsp;&nbsp;&nbsp;&nbsp;
                                        {/* 目录列表 */}
                                        {
                                            page.categories && page.categories.length ?
                                                <img src="/images/categories.svg" style="width: 20px;"
                                                     title="文章所属目录列表"/> : null
                                        }
                                        &nbsp;&nbsp;
                                        {page.categories && page.categories.length ?
                                            page.categories.map((category,index) => {
                                                return <a class="category-link article-meta-element"
                                                          href={url_for(category.path)}>{category.name}{
                                                    index == page.categories.length-1 ?null:'，'
                                                }</a>
                                            })
                                            : null}
                                        &nbsp;&nbsp;&nbsp;&nbsp;
                                        {/* 标签列表 */}
                                        {
                                            page.tags && page.tags.length ?
                                                <img src="/images/tag.svg" style="width: 23px;"
                                                     title="文章标签列表"/>
                                                : null
                                        }
                                        &nbsp;&nbsp;
                                        {page.tags && page.tags.length ?
                                            page.tags.map((tag,index) => {
                                                return <a class="category-link article-meta-element"
                                                          href={url_for(tag.path)}>{tag.name}{
                                                              index == page.tags.length-1 ?null:'，'
                                                }</a>
                                            })
                                            : null}
                                    </div>
                                </div> : null
                        }
                        {/* 推荐阅读 & 新闻 */}
                        {!index && !page.customize && recommended.enable ?
                            <div style="height: 50px;padding-top: 10px;vertical-align: middle;">
                                <a href={recommended.url} target="_blank">{recommended.title}</a>
                            </div>
                            : null}
                        {!index && !page.customize ? <br/> : null}
                        {/* Content/Excerpt */}
                        <div class="content"
                             dangerouslySetInnerHTML={{__html: index && page.excerpt ? page.excerpt : page.content}}></div>
                        {/* Licensing block */}
                        {!index && page.article_type == '原创' && article && article.licenses && Object.keys(article.licenses)
                            ? <ArticleLicensing.Cacheable page={page} config={config} helper={helper}/> : null}
                        {/* "Read more" button */}
                        {index && page.excerpt ? <a class="article-more button is-small is-size-7"
                                                    href={`${url_for(page.link || page.path)}#more`}>{__('article.more')}</a> : null}
                        {/* Share button */}
                        {!index ? <Share config={config} page={page} helper={helper}/> : null}
                    </article>

                </div>
            </div>
            {/* Donate button */}
            {!index ? <Donates config={config} helper={helper}/> : null}
            {/* Post navigation */}
            {!index && (page.prev || page.next) ? <nav class="post-navigation mt-4 level is-mobile">
                {page.prev ? <div class="level-start">
                    <a class={`article-nav-prev level level-item${!page.prev ? ' is-hidden-mobile' : ''} link-muted`}
                       href={url_for(page.prev.path)}>
                        <i class="level-item fas fa-chevron-left"></i>
                        <span class="level-item">{page.prev.title}</span>
                    </a>
                </div> : null}
                {page.next ? <div class="level-end">
                    <a class={`article-nav-next level level-item${!page.next ? ' is-hidden-mobile' : ''} link-muted`}
                       href={url_for(page.next.path)}>
                        <span class="level-item">{page.next.title}</span>
                        <i class="level-item fas fa-chevron-right"></i>
                    </a>
                </div> : null}
            </nav> : null}
            {/* Comment */}
            {!index && page.enable_comment ? <Comment config={config} page={page} helper={helper}/> : null}
            {/* 引流插件，readmore */}
            <script src={url_for('/js/readmore.js')}></script>
            <script src={url_for('/js/readmore-use.js')}></script>
        </Fragment>;
    }
};
