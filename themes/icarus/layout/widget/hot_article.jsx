import {Component} from "inferno";
import {require} from "hexo-component-inferno/lib/core/view";
const Hr = require('./common/hr')
/**
 * 热门文章组件
 */
class HotArticle extends Component {
    render() {
        const {site, widget} = this.props;
        return <div class="card widget">
            <Hr title="热门文章"/>
            <div class="card-content" style="font-size: 14px;font-weight:500;line-height: 35px">
                {
                    site.posts.filter(post => post.hot).sort('date', -1).limit(widget.show_count).map((post, index) => {
                        return <p class="p-overflow"><a href={post.id + ".html"}><img
                            src="/images/hot.gif"/>&nbsp;{post.sort_title ? post.sort_title : post.title}</a></p>
                    })
                }
            </div>
        </div>;
    }
}

module.exports = HotArticle;