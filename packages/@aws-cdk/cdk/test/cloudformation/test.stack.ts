import { Test } from 'nodeunit';
import { Condition, Construct, Include, Output, Parameter, Resource, Root, Stack, Token } from '../../lib';

export = {
  'a stack can be serialized into a CloudFormation template, initially it\'s empty'(test: Test) {
    const stack = new Stack();
    test.deepEqual(stack.toCloudFormation(), { });
    test.done();
  },

  'stack objects have some template-level propeties, such as Description, Version, Transform'(test: Test) {
    const stack = new Stack();
    stack.templateOptions.templateFormatVersion = 'MyTemplateVersion';
    stack.templateOptions.description = 'This is my description';
    stack.templateOptions.transform = 'SAMy';
    test.deepEqual(stack.toCloudFormation(), {
      Description: 'This is my description',
      AWSTemplateFormatVersion: 'MyTemplateVersion',
      Transform: 'SAMy'
    });
    test.done();
  },

  'Stack.find(c) can be used to find the stack from any point in the tree'(test: Test) {
    const stack = new Stack();
    stack.push();
      const level1 = new Construct('level1');
      level1.push();
        const res1 = new Resource('childoflevel1', { type: 'MyResourceType1' });
        const level2 = new Construct('level2');
        level2.push();
          const level3 = new Construct('level3');
          level3.push();
            const res2 = new Resource('childoflevel3', { type: 'MyResourceType2' });
          level3.pop();
        level2.pop();
      level1.pop();
    stack.pop();
    

    test.equal(Stack.find(res1), stack);
    test.equal(Stack.find(res2), stack);
    test.equal(Stack.find(level2), stack);

    const root = new Root();
    root.push();
      const child = new Construct('child');
    root.pop();

    test.throws(() => Stack.find(child));
    test.throws(() => Stack.find(root));

    test.done();
  },

  'Stack.isStack indicates that a construct is a stack'(test: Test) {
    const stack = new Stack();
    stack.push();
    const c = new Construct('Construct');
    stack.pop();
    test.ok(stack.isStack);
    test.ok(!(c as any).isStack);
    test.done();
  },

  'stack.id is not included in the logical identities of resources within it'(test: Test) {
    const stack = new Stack('MyStack');
    stack.push();
    new Resource('MyResource', { type: 'MyResourceType' });
    stack.pop();

    test.deepEqual(stack.toCloudFormation(), { Resources: { MyResource: { Type: 'MyResourceType' } } });
    test.done();
  },

  'stack.templateOptions can be used to set template-level options'(test: Test) {
    const stack = new Stack();

    stack.templateOptions.description = 'StackDescription';
    stack.templateOptions.templateFormatVersion = 'TemplateVersion';
    stack.templateOptions.transform = 'Transform';
    stack.templateOptions.metadata = {
      MetadataKey: 'MetadataValue'
    };

    test.deepEqual(stack.toCloudFormation(), {
      Description: 'StackDescription',
      Transform: 'Transform',
      AWSTemplateFormatVersion: 'TemplateVersion',
      Metadata: { MetadataKey: 'MetadataValue' }
    });

    test.done();
  },

  // This approach will only apply to TypeScript code, but at least it's a temporary
  // workaround for people running into issues caused by SDK-3003.
  // We should come up with a proper solution that involved jsii callbacks (when they exist)
  // so this can be implemented by jsii languages as well.
  'Overriding `Stack.toCloudFormation` allows arbitrary post-processing of the generated template during synthesis'(test: Test) {

    const stack = new StackWithPostProcessor();
    
    stack.push();

    new Resource('myResource', {
      type: 'AWS::MyResource',
      properties: {
        MyProp1: 'hello',
        MyProp2: 'howdy',
        Environment: {
          Key: 'value'
        }
      }
    });
    
    stack.pop();

    test.deepEqual(stack.toCloudFormation(), { Resources:
      { myResource:
         { Type: 'AWS::MyResource',
         Properties:
          { MyProp1: 'hello',
          MyProp2: 'howdy',
          Environment: { key: 'value' } } } } });

    test.done();
  },

  'Construct.findResource(logicalId) can be used to retrieve a resource by its path'(test: Test) {
    const stack = new Stack();
    
    stack.push();

    test.ok(!stack.tryFindChild('foo'), 'empty stack');

    const r1 = new Resource('Hello', { type: 'MyResource' });
    test.equal(stack.findResource(r1.stackPath), r1, 'look up top-level');

    const child = new Construct('Child');
    child.push();
    const r2 = new Resource('Hello', { type: 'MyResource' });
    child.pop();

    test.equal(stack.findResource(r2.stackPath), r2, 'look up child');
    stack.pop();

    test.done();
  },

  'Stack.findResource will fail if the element is not a resource'(test: Test) {
    const stack = new Stack();
    stack.push();
    const p = new Parameter('MyParam', { type: 'String' });
    stack.pop();
    
    test.throws(() => stack.findResource(p.path));
    test.done();
  },

  'Stack.getByPath can be used to find any CloudFormation element (Parameter, Output, etc)'(test: Test) {

    const stack = new Stack();
    stack.push();

    const p = new Parameter('MyParam', { type: 'String' });
    const o = new Output('MyOutput');
    const c = new Condition('MyCondition');
    
    stack.pop();

    test.equal(stack.findChild(p.path), p);
    test.equal(stack.findChild(o.path), o);
    test.equal(stack.findChild(c.path), c);

    test.done();
  },

  'Stack names can have hyphens in them'(test: Test) {
    new Stack('Hello-World');
    // Did not throw

    test.done();
  },

  'Include should support non-hash top-level template elements like "Description"'(test: Test) {
    const stack = new Stack();
    stack.push();

    const template = {
      Description: 'hello, world'
    };

    new Include('Include', { template });
    
    stack.pop();

    const output = stack.toCloudFormation();

    test.equal(typeof output.Description, 'string');
    test.done();
  },

  'Can\'t add children during synthesis'(test: Test) {
    const stack = new Stack();

    stack.push();

    // add a construct with a token that when resolved adds a child. this
    // means that this child is going to be added during synthesis and this
    // is a no-no.
    new Resource('Resource', { type: 'T', properties: {
      foo: new Token(() => new Construct('Foo'))
    }});

    test.throws(() => stack.toCloudFormation(), /Cannot add children during synthesis/);

    // okay to add after synthesis
    new Construct('C1');
    
    stack.pop();

    test.done();
  },
};

class StackWithPostProcessor extends Stack {

  // ...

  public toCloudFormation() {
    const template = super.toCloudFormation();

    // manipulate template (e.g. rename "Key" to "key")
    template.Resources.myResource.Properties.Environment.key =
      template.Resources.myResource.Properties.Environment.Key;
    delete template.Resources.myResource.Properties.Environment.Key;

    return template;
  }
}
