const { Component } = require('inferno');
const gravatrHelper = require('hexo-util').gravatar;
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

/**
 * 个人简介组件
 */
class Profile extends Component {

    render() {
        return <div class="card widget" data-type="profile">
            <div class="card-content" style="padding:0px">
                <img src="/images/profile2.png" />
                <div class="article-platform">
                      <span><a href="https://www.jianshu.com/u/092df3f77bca" title="简书" target="_blank"><img src="/images/简书.png"
                                                                                                               width="25" /></a></span>
                    <span><a href="https://me.csdn.net/weixin_42033269" title="CSDN" target="_blank"><img src="/images/csdn.svg"
                                                                                                          width="25" /></a></span>
                    <span><a href="https://juejin.im/user/5a0aaeecf265da43163c96b7" title="掘金" target="_blank"><img
                        src="/images/juejin-logo.svg" width="25" /></a></span>
                    <span><a href="https://segmentfault.com/u/hengyushaonian/articles" title="思否" target="_blank"><img
                        src="/images/思否.png" width="25" /></a></span>
                    <span><a href="https://www.zhihu.com/people/heng-yu-shao-nian/posts" title="知乎" target="_blank"><img
                        src="/images/知乎.svg" width="25" /></a></span>
                    <span><a href="https://gitee.com/hengboy" title="源码托管平台：码云" target="_blank"><img src="/images/gitee.png"
                                                                                                             width="25" /></a></span>
                    <span><a href="https://github.com/hengboy" title="源码托管平台：GitHub" target="_blank"><img src="/images/GitHub.svg"
                                                                                                                width="25" /></a></span>
                </div>

            </div>
        </div>;
    }
}

Profile.Cacheable = cacheComponent(Profile, 'widget.profile', props => {
    const { site, helper, widget } = props;
    const {
        avatar,
        gravatar,
        avatar_rounded = false,
        author = props.config.author,
        author_title,
        location,
        follow_link,
        social_links
    } = widget;
    const { url_for, _p, __ } = helper;

    function getAvatar() {
        if (gravatar) {
            return gravatrHelper(gravatar, 128);
        }
        if (avatar) {
            return url_for(avatar);
        }
        return url_for('/img/avatar.png');
    }

    const postCount = site.posts.length;
    const categoryCount = site.categories.filter(category => category.length).length;
    const tagCount = site.tags.filter(tag => tag.length).length;

    const socialLinks = social_links ? Object.keys(social_links).map(name => {
        const link = social_links[name];
        if (typeof link === 'string') {
            return {
                name,
                url: url_for(link)
            };
        }
        return {
            name,
            url: url_for(link.url),
            icon: link.icon
        };
    }) : null;

    return {
        avatar: getAvatar(),
        avatarRounded: avatar_rounded,
        author,
        authorTitle: author_title,
        location,
        counter: {
            post: {
                count: postCount,
                title: _p('common.post', postCount),
                url: url_for('/archives')
            },
            category: {
                count: categoryCount,
                title: _p('common.category', categoryCount),
                url: url_for('/categories')
            },
            tag: {
                count: tagCount,
                title: _p('common.tag', tagCount),
                url: url_for('/tags')
            }
        },
        followLink: follow_link ? url_for(follow_link) : undefined,
        followTitle: __('widget.follow'),
        socialLinks
    };
});

module.exports = Profile;
